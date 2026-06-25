import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import db from "../../db/connection";
import { signToken, generateRefreshToken } from "../../middleware/auth";
import { UnauthorizedError, ConflictError, NotFoundError } from "../../utils/errors";
import { config } from "../../config";
import type { JwtPayload, RoleName } from "../../types";
import type { CreateUserInput, LoginInput } from "./schema";

function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

/**
 * Calcola la scadenza del refresh token in ISO string.
 */
function refreshExpiresAt(): string {
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const num = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit] || 86400000;
  return new Date(Date.now() + num * ms).toISOString();
}

export function login(input: LoginInput) {
  const user = db
    .prepare("SELECT id, username, password_hash FROM user WHERE username = ?")
    .get(input.username) as any;

  if (!user || !verifyPassword(input.password, user.password_hash)) {
    throw new UnauthorizedError("Credenziali non valide");
  }

  // Carica ruoli
  const roles = db
    .prepare(
      `SELECT r.name FROM role r
       JOIN user_role ur ON ur.id_role = r.id
       WHERE ur.id_user = ?`
    )
    .all(user.id)
    .map((r: any) => r.name) as RoleName[];

  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    userId: user.id,
    roles,
  };

  const accessToken = signToken(payload);
  const refreshToken = generateRefreshToken();

  // Salva refresh token hashato
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  db.prepare(
    "INSERT INTO refresh_token (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(tokenHash, user.id, refreshExpiresAt());

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, username: user.username, roles },
  };
}

export function refreshAccessToken(refreshToken: string) {
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const stored = db
    .prepare("SELECT * FROM refresh_token WHERE token_hash = ? AND revoked = 0")
    .get(tokenHash) as any;

  if (!stored) {
    throw new UnauthorizedError("Refresh token non valido");
  }

  if (new Date(stored.expires_at) < new Date()) {
    throw new UnauthorizedError("Refresh token scaduto");
  }

  // Revoca il vecchio token (rotation)
  db.prepare("UPDATE refresh_token SET revoked = 1 WHERE id = ?").run(stored.id);

  // Carica ruoli
  const roles = db
    .prepare(
      `SELECT r.name FROM role r
       JOIN user_role ur ON ur.id_role = r.id
       WHERE ur.id_user = ?`
    )
    .all(stored.user_id)
    .map((r: any) => r.name) as RoleName[];

  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    userId: stored.user_id,
    roles,
  };

  const newAccessToken = signToken(payload);
  const newRefreshToken = generateRefreshToken();

  // Salva nuovo refresh token
  const newHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
  db.prepare(
    "INSERT INTO refresh_token (token_hash, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(newHash, stored.user_id, refreshExpiresAt());

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export function logout(refreshToken: string) {
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  db.prepare("UPDATE refresh_token SET revoked = 1 WHERE token_hash = ?").run(tokenHash);
}

export function getMe(userId: number) {
  const user = db
    .prepare(
      "SELECT id, username, email, first_name, last_name, dob, state, city, address FROM user WHERE id = ?"
    )
    .get(userId) as any;

  if (!user) throw new NotFoundError("Utente");

  const roles = db
    .prepare(
      `SELECT r.name FROM role r
       JOIN user_role ur ON ur.id_role = r.id
       WHERE ur.id_user = ?`
    )
    .all(userId)
    .map((r: any) => r.name);

  return { ...user, roles };
}

export function createUser(input: CreateUserInput) {
  // Verifica unicita'
  const existing = db
    .prepare("SELECT id FROM user WHERE username = ? OR email = ?")
    .get(input.username, input.email);
  if (existing) throw new ConflictError("Username o email già in uso");

  const { roles, password, ...rest } = input;

  const result = db
    .prepare(
      `INSERT INTO user (username, email, first_name, last_name, password_hash, dob, state, city, address)
       VALUES (@username, @email, @first_name, @last_name, @password_hash, @dob, @state, @city, @address)`
    )
    .run({
      ...rest,
      password_hash: hashPassword(password),
      dob: input.dob || null,
      state: input.state || null,
      city: input.city || null,
      address: input.address || null,
    });

  const userId = result.lastInsertRowid as number;

  // Assegna ruoli
  if (roles.length > 0) {
    const assignStmt = db.prepare("INSERT OR IGNORE INTO user_role (id_role, id_user) VALUES (?, ?)");
    for (const roleName of roles) {
      const role = db.prepare("SELECT id FROM role WHERE name = ?").get(roleName) as any;
      if (role) {
        assignStmt.run(role.id, userId);
      }
    }
  }

  return getMe(userId);
}

export function updateUser(userId: number, input: Partial<CreateUserInput>) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId) as any;
  if (!user) throw new NotFoundError("Utente");

  const { roles, password, ...rest } = input;
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (password) {
    fields.push("password_hash = ?");
    values.push(hashPassword(password));
  }

  fields.push("updated_at = datetime('now')");

  if (fields.length > 1) {
    values.push(userId);
    db.prepare(`UPDATE user SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  // Aggiorna ruoli se forniti
  if (roles) {
    db.prepare("DELETE FROM user_role WHERE id_user = ?").run(userId);
    const assignStmt = db.prepare("INSERT OR IGNORE INTO user_role (id_role, id_user) VALUES (?, ?)");
    for (const roleName of roles) {
      const role = db.prepare("SELECT id FROM role WHERE name = ?").get(roleName) as any;
      if (role) {
        assignStmt.run(role.id, userId);
      }
    }
  }

  return getMe(userId);
}

export function listUsers() {
  const users = db
    .prepare(
      "SELECT id, username, email, first_name, last_name, dob, state, city, address, created_at, updated_at FROM user"
    )
    .all() as any[];

  return users.map((u) => {
    const roles = db
      .prepare(
        `SELECT r.name FROM role r
         JOIN user_role ur ON ur.id_role = r.id
         WHERE ur.id_user = ?`
      )
      .all(u.id)
      .map((r: any) => r.name);
    return { ...u, roles };
  });
}

export function getUserById(id: number) {
  const user = db
    .prepare(
      "SELECT id, username, email, first_name, last_name, dob, state, city, address FROM user WHERE id = ?"
    )
    .get(id) as any;
  if (!user) throw new NotFoundError("Utente");
  const roles = db
    .prepare(
      `SELECT r.name FROM role r
       JOIN user_role ur ON ur.id_role = r.id
       WHERE ur.id_user = ?`
    )
    .all(id)
    .map((r: any) => r.name);
  return { ...user, roles };
}

export function deleteUser(id: number) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(id) as any;
  if (!user) throw new NotFoundError("Utente");
  db.transaction(() => {
    db.prepare("DELETE FROM user_role WHERE id_user = ?").run(id);
    db.prepare("DELETE FROM refresh_token WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM user WHERE id = ?").run(id);
  })();
}

// User Roles
export function getUserRoles(userId: number) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId) as any;
  if (!user) throw new NotFoundError("Utente");
  const roles = db
    .prepare(
      `SELECT r.id, r.name, r.description FROM role r
       JOIN user_role ur ON ur.id_role = r.id
       WHERE ur.id_user = ?`
    )
    .all(userId);
  return roles;
}

export function setUserRoles(userId: number, roleNames: string[]) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId) as any;
  if (!user) throw new NotFoundError("Utente");

  db.prepare("DELETE FROM user_role WHERE id_user = ?").run(userId);

  const assignStmt = db.prepare("INSERT OR IGNORE INTO user_role (id_role, id_user) VALUES (?, ?)");
  for (const roleName of roleNames) {
    const role = db.prepare("SELECT id FROM role WHERE name = ?").get(roleName) as any;
    if (role) {
      assignStmt.run(role.id, userId);
    }
  }

  return getUserRoles(userId);
}

export function addUserRole(userId: number, roleName: string) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId) as any;
  if (!user) throw new NotFoundError("Utente");

  const role = db.prepare("SELECT id FROM role WHERE name = ?").get(roleName) as any;
  if (!role) throw new NotFoundError("Ruolo");

  const existing = db.prepare("SELECT 1 FROM user_role WHERE id_user = ? AND id_role = ?").get(userId, role.id);
  if (existing) throw new ConflictError("Utente ha già questo ruolo");

  db.prepare("INSERT INTO user_role (id_role, id_user) VALUES (?, ?)").run(role.id, userId);
  return getUserRoles(userId);
}

export function removeUserRole(userId: number, roleName: string) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId) as any;
  if (!user) throw new NotFoundError("Utente");

  const role = db.prepare("SELECT id FROM role WHERE name = ?").get(roleName) as any;
  if (!role) throw new NotFoundError("Ruolo");

  const result = db.prepare("DELETE FROM user_role WHERE id_user = ? AND id_role = ?").run(userId, role.id);
  if (result.changes === 0) throw new NotFoundError("Ruolo non assegnato all'utente");

  return getUserRoles(userId);
}

// User Effective Permissions
export function getUserPermissions(userId: number) {
  const user = db.prepare("SELECT id FROM user WHERE id = ?").get(userId) as any;
  if (!user) throw new NotFoundError("Utente");

  const permissions = db
    .prepare(
      `SELECT DISTINCT p.id, p.name, p.description FROM permission p
       JOIN role_permission rp ON rp.id_permission = p.id
       JOIN user_role ur ON ur.id_role = rp.id_role
       WHERE ur.id_user = ?`
    )
    .all(userId);
  return permissions;
}
