import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../types";
import * as service from "./service";
import { createClassSchema, updateClassSchema, assignTeacherSchema, enrollStudentSchema } from "./schema";
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
    const parsed = createClassSchema.parse(req.body);
    res.status(201).json(service.create(parsed));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateClassSchema.parse(req.body);
    res.json(service.update(paramId(req), parsed));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    service.remove(paramId(req));
    res.json({ message: "Classe eliminata" });
  } catch (err) { next(err); }
}

export function assignTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const classId = paramId(req);
    const parsed = assignTeacherSchema.parse(req.body);
    res.status(201).json(service.assignTeacher(classId, parsed));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function removeTeacherAssignment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    service.removeTeacherAssignment(paramId(req, "assignmentId"));
    res.json({ message: "Assegnazione rimossa" });
  } catch (err) { next(err); }
}

export function getTeacherAssignments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getTeacherAssignments(paramId(req)));
  } catch (err) { next(err); }
}

export function enrollStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const classId = paramId(req);
    const parsed = enrollStudentSchema.parse(req.body);
    res.status(201).json(service.enrollStudent(classId, parsed));
  } catch (err) {
    if (err instanceof Error && "issues" in (err as any)) return next(new ValidationError((err as any).issues));
    next(err);
  }
}

export function removeEnrollment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    service.removeEnrollment(paramId(req, "enrollmentId"));
    res.json({ message: "Iscrizione rimossa" });
  } catch (err) { next(err); }
}

export function getEnrollments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getEnrollments(paramId(req)));
  } catch (err) { next(err); }
}

export function getMyClass(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getStudentClass(req.user!.userId));
  } catch (err) { next(err); }
}

export function getMyClasses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getTeacherClasses(req.user!.userId));
  } catch (err) { next(err); }
}

export function getMyClassesWithStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json(service.getTeacherClassesWithStudents(req.user!.userId));
  } catch (err) { next(err); }
}

export function getTeacherClassesById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const teacherId = paramId(req);
    // Admin/principal can view any teacher's classes
    // Teacher can only view their own
    if (req.user!.roles.includes("teacher") && req.user!.userId !== teacherId) {
      return next(new Error("Non autorizzato: puoi vedere solo le tue classi"));
    }
    res.json(service.getTeacherClasses(teacherId));
  } catch (err) { next(err); }
}

export function getTeacherClassesWithStudentsById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const teacherId = paramId(req);
    if (req.user!.roles.includes("teacher") && req.user!.userId !== teacherId) {
      return next(new Error("Non autorizzato: puoi vedere solo le tue classi"));
    }
    res.json(service.getTeacherClassesWithStudents(teacherId));
  } catch (err) { next(err); }
}
