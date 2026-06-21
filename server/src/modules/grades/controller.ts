import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../types";
import * as service from "./service";
import { createGradeSchema, updateGradeSchema } from "./schema";
import { ValidationError } from "../../utils/errors";
import { paramId } from "../../utils/params";

export function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { res.json(service.list()); } catch (err) { next(err); }
}

export function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { res.json(service.getById(paramId(req))); } catch (err) { next(err); }
}

export function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createGradeSchema.parse(req.body);
    res.status(201).json(service.create(parsed, req.user!.userId));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateGradeSchema.parse(req.body);
    res.json(service.update(paramId(req), parsed, req.user!.userId));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    service.remove(paramId(req), req.user!.userId);
    res.json({ message: "Voto eliminato" });
  } catch (err) { next(err); }
}

export function getMyGrades(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getStudentGrades(req.user!.userId));
  } catch (err) { next(err); }
}

export function getTeacherGradesCtrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getTeacherGrades(req.user!.userId));
  } catch (err) { next(err); }
}

export function getUserGradesCtrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = paramId(req);
    const result = service.getUserGrades(userId, req.user!.userId, req.user!.roles);
    res.json(result);
  } catch (err) { next(err); }
}
