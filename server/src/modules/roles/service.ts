import db from "../../db/connection";
import { ConflictError, NotFoundError } from "../../utils/errors";
import type { CreateRoleInput, UpdateRoleInput } from "./schema";

export function list() {
  const roles = db.prepare("SELECT * FROM role").all() as any[];
  return roles.map((r) => {
    const permissions = db
      .prepare(
        `SELECT p.name FROM permission p
         JOIN role_permission rp ON rp.id_permission = p.id
         WHERE rp.id_role = ?`
      )
      .all(r.id)
      .map((p: any) => p.name);
    return { ...r, permissions };
  });
}

export function getById(id: number) {
  const role = db.prepare("SELECT * FROM role WHERE id = ?").get(id) as any;
  if (!role) throw new NotFoundError("Ruolo");
  const permissions = db
    .prepare(
      `SELECT p.name FROM permission p
       JOIN role_permission rp ON rp.id_permission = p.id
       WHERE rp.id_role = ?`
    )
    .all(id)
    .map((p: any) => p.name);
  return { ...role, permissions };
}

export function create(input: CreateRoleInput) {
  const existing = db.prepare("SELECT id FROM role WHERE name = ?").get(input.name);
  if (existing) throw new ConflictError("Ruolo già esistente");

  const result = db
    .prepare("INSERT INTO role (name, description) VALUES (?, ?)")
    .run(input.name, input.description || null);

  const roleId = result.lastInsertRowid as number;

  if (input.permissions.length > 0) {
    const stmt = db.prepare("INSERT OR IGNORE INTO role_permission (id_role, id_permission) VALUES (?, (SELECT id FROM permission WHERE name = ?))");
    for (const perm of input.permissions) {
      stmt.run(roleId, perm);
    }
  }

  return getById(roleId);
}

export function update(id: number, input: UpdateRoleInput) {
  getById(id); // exists check

  if (input.name !== undefined) {
    const existing = db.prepare("SELECT id FROM role WHERE name = ? AND id != ?").get(input.name, id);
    if (existing) throw new ConflictError("Nome ruolo già in uso");
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { fields.push("name = ?"); values.push(input.name); }
  if (input.description !== undefined) { fields.push("description = ?"); values.push(input.description); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE role SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  if (input.permissions) {
    db.prepare("DELETE FROM role_permission WHERE id_role = ?").run(id);
    const stmt = db.prepare("INSERT OR IGNORE INTO role_permission (id_role, id_permission) VALUES (?, (SELECT id FROM permission WHERE name = ?))");
    for (const perm of input.permissions) {
      stmt.run(id, perm);
    }
  }

  return getById(id);
}

export function remove(id: number) {
  getById(id); // exists check
  db.transaction(() => {
    db.prepare("DELETE FROM role_permission WHERE id_role = ?").run(id);
    db.prepare("DELETE FROM user_role WHERE id_role = ?").run(id);
    db.prepare("DELETE FROM role WHERE id = ?").run(id);
  })();
}

// Permissions
export function listPermissions() {
  return db.prepare("SELECT * FROM permission").all();
}

export function createPermission(name: string, description?: string) {
  const existing = db.prepare("SELECT id FROM permission WHERE name = ?").get(name);
  if (existing) throw new ConflictError("Permesso già esistente");
  const result = db
    .prepare("INSERT INTO permission (name, description) VALUES (?, ?)")
    .run(name, description || null);
  return db.prepare("SELECT * FROM permission WHERE id = ?").get(result.lastInsertRowid);
}
