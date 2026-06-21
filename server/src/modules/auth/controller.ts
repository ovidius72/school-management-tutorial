import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../types";
import * as authService from "./service";
import { loginSchema, createUserSchema, updateUserSchema } from "./schema";
import { ValidationError } from "../../utils/errors";
import { paramId } from "../../utils/params";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/api/auth",
  secure: process.env.NODE_ENV === "production",
};

export function login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = authService.login(parsed);

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refresh_token", result.refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) {
      return next(new ValidationError((err as any).issues));
    }
    next(err);
  }
}

export function refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const refreshToken = (req.cookies?.refresh_token as string) || (req.body?.refreshToken as string);
    if (!refreshToken) {
      throw new ValidationError("Refresh token mancante");
    }

    const result = authService.refreshAccessToken(refreshToken);

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refresh_token", result.refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) {
      return next(new ValidationError((err as any).issues));
    }
    next(err);
  }
}

export function logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token as string;
    if (refreshToken) {
      authService.logout(refreshToken);
    }

    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api/auth" });

    res.json({ message: "Logout effettuato" });
  } catch (err) {
    next(err);
  }
}

export function me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = authService.getMe(req.user!.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createUserSchema.parse(req.body);
    const user = authService.createUser(parsed);
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) {
      return next(new ValidationError((err as any).issues));
    }
    next(err);
  }
}

export function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const parsed = updateUserSchema.parse(req.body);
    const user = authService.updateUser(id, parsed);
    res.json(user);
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) {
      return next(new ValidationError((err as any).issues));
    }
    next(err);
  }
}

export function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const users = authService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    const user = authService.getUserById(id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = paramId(req);
    authService.deleteUser(id);
    res.json({ message: "Utente eliminato" });
  } catch (err) {
    next(err);
  }
}
