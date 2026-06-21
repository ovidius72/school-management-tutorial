import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../types";
import * as service from "./service";
import { schoolYearSchema, schoolYearUpdateSchema } from "./schema";
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
    const parsed = schoolYearSchema.parse(req.body);
    res.status(201).json(service.create(parsed));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = schoolYearUpdateSchema.parse(req.body);
    res.json(service.update(paramId(req), parsed));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    service.remove(paramId(req));
    res.json({ message: "Anno scolastico eliminato" });
  } catch (err) { next(err); }
}
