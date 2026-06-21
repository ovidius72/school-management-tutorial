import type { Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import type { AuthenticatedRequest, RoleName } from "../types";

/**
 * Middleware che verifica che l'utente abbia ALMENO uno dei ruoli indicati.
 * Usare DOPO authenticate().
 */
export function authorize(...allowedRoles: RoleName[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Autenticazione richiesta"));
    }

    const hasRole = req.user.roles.some((r) =>
      allowedRoles.includes(r as RoleName)
    );
    if (!hasRole) {
      return next(new ForbiddenError("Non hai i permessi per questa operazione"));
    }

    next();
  };
}
