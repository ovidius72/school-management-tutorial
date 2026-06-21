import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { UnauthorizedError } from "../utils/errors";
import type { AuthenticatedRequest, JwtPayload } from "../types";

/**
 * Estrae il token JWT dal cookie httpOnly o dall'header Authorization.
 * Cookie > Header.
 */
function extractToken(req: AuthenticatedRequest): string | null {
  // Cookie
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) return cookieToken;

  // Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

/**
 * Middleware che verifica il JWT e popola req.user.
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError("Token mancante"));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Token non valido o scaduto"));
  }
}

/**
 * Genera un JWT per l'access token.
 */
export function signToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });
}

/**
 * Il refresh token è un UUID casuale, non un JWT.
 * Viene salvato hashato nel DB, lato server.
 */
export function generateRefreshToken(): string {
  return uuidv4();
}
