import db from "../../db/connection";
import { NotFoundError, ConflictError } from "../../utils/errors";
import type { CreateClassInput, UpdateClassInput, AssignTeacherInput, EnrollStudentInput } from "./schema";

export function list() {
  return db
    .prepare(
      `SELECT c.*, sy.name as school_year_name
       FROM class c
       JOIN school_year sy ON sy.id = c.school_year_id
       ORDER BY sy.start_date DESC, c.name`
    )
    .all();
}

export function getById(id: number) {
  const row = db
    .prepare(
      `SELECT c.*, sy.name as school_year_name
       FROM class c
       JOIN school_year sy ON sy.id = c.school_year_id
       WHERE c.id = ?`
    )
    .get(id);
  if (!row) throw new NotFoundError("Classe");
  return row;
}

export function create(input: CreateClassInput) {
  // Verifica che school_year esista
  const sy = db.prepare("SELECT id FROM school_year WHERE id = ?").get(input.school_year_id);
  if (!sy) throw new NotFoundError("Anno scolastico");

  // Verifica unicità (name, school_year_id)
  const existing = db
    .prepare("SELECT id FROM class WHERE name = ? AND school_year_id = ?")
    .get(input.name, input.school_year_id);
  if (existing) throw new ConflictError("Classe già esistente per questo anno scolastico");

  const result = db
    .prepare("INSERT INTO class (name, school_year_id) VALUES (?, ?)")
    .run(input.name, input.school_year_id);

  return getById(result.lastInsertRowid as number);
}

export function update(id: number, input: UpdateClassInput) {
  getById(id); // exists check

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { fields.push("name = ?"); values.push(input.name); }
  if (input.school_year_id !== undefined) { fields.push("school_year_id = ?"); values.push(input.school_year_id); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE class SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return getById(id);
}

export function remove(id: number) {
  getById(id);
  db.transaction(() => {
    db.prepare("DELETE FROM class_enrollment WHERE class_id = ?").run(id);
    db.prepare("DELETE FROM teacher_assignment WHERE class_id = ?").run(id);
    db.prepare("DELETE FROM class WHERE id = ?").run(id);
  })();
}

// Teacher assignments
export function assignTeacher(classId: number, input: AssignTeacherInput) {
  getById(classId);
  const teacher = db.prepare("SELECT id FROM user WHERE id = ?").get(input.teacher_id);
  if (!teacher) throw new NotFoundError("Insegnante");
  const subject = db.prepare("SELECT id FROM subject WHERE id = ?").get(input.subject_id);
  if (!subject) throw new NotFoundError("Materia");

  try {
    const result = db
      .prepare("INSERT INTO teacher_assignment (teacher_id, class_id, subject_id) VALUES (?, ?, ?)")
      .run(input.teacher_id, classId, input.subject_id);
    return db.prepare("SELECT * FROM teacher_assignment WHERE id = ?").get(result.lastInsertRowid);
  } catch (err: any) {
    if (err?.code === "SQLITE_CONSTRAINT") throw new ConflictError("Insegnante già assegnato a questa classe/materia");
    throw err;
  }
}

export function removeTeacherAssignment(assignmentId: number) {
  const row = db.prepare("SELECT id FROM teacher_assignment WHERE id = ?").get(assignmentId);
  if (!row) throw new NotFoundError("Assegnazione");
  db.prepare("DELETE FROM teacher_assignment WHERE id = ?").run(assignmentId);
}

export function getTeacherAssignments(classId: number) {
  return db
    .prepare(
      `SELECT ta.*, u.first_name || ' ' || u.last_name as teacher_name, s.name as subject_name
       FROM teacher_assignment ta
       JOIN user u ON u.id = ta.teacher_id
       JOIN subject s ON s.id = ta.subject_id
       WHERE ta.class_id = ?`
    )
    .all(classId);
}

// Enrollments
export function enrollStudent(classId: number, input: EnrollStudentInput) {
  getById(classId);
  const student = db.prepare("SELECT id FROM user WHERE id = ?").get(input.student_id);
  if (!student) throw new NotFoundError("Studente");

  try {
    const result = db
      .prepare("INSERT INTO class_enrollment (class_id, student_id) VALUES (?, ?)")
      .run(classId, input.student_id);
    return db.prepare("SELECT * FROM class_enrollment WHERE id = ?").get(result.lastInsertRowid);
  } catch (err: any) {
    if (err?.code === "SQLITE_CONSTRAINT") throw new ConflictError("Studente già iscritto a questa classe");
    throw err;
  }
}

export function removeEnrollment(enrollmentId: number) {
  const row = db.prepare("SELECT id FROM class_enrollment WHERE id = ?").get(enrollmentId);
  if (!row) throw new NotFoundError("Iscrizione");
  db.prepare("DELETE FROM class_enrollment WHERE id = ?").run(enrollmentId);
}

export function getEnrollments(classId: number) {
  return db
    .prepare(
      `SELECT ce.*, u.first_name || ' ' || u.last_name as student_name, u.username
       FROM class_enrollment ce
       JOIN user u ON u.id = ce.student_id
       WHERE ce.class_id = ?`
    )
    .all(classId);
}

// Per studenti: classe dello studente
export function getStudentClass(studentId: number) {
  const enrollment = db
    .prepare(
      `SELECT c.*, sy.name as school_year_name
       FROM class_enrollment ce
       JOIN class c ON c.id = ce.class_id
       JOIN school_year sy ON sy.id = c.school_year_id
       WHERE ce.student_id = ?`
    )
    .get(studentId) as any;
  if (!enrollment) throw new NotFoundError("Classe per questo studente");
  return enrollment;
}

// Teacher classes
export function getTeacherClasses(teacherId: number) {
  return db
    .prepare(
      `SELECT c.*, sy.name as school_year_name,
              s.name as subject_name, s.id as subject_id
       FROM teacher_assignment ta
       JOIN class c ON c.id = ta.class_id
       JOIN school_year sy ON sy.id = c.school_year_id
       JOIN subject s ON s.id = ta.subject_id
       WHERE ta.teacher_id = ?
       ORDER BY c.name, s.name`
    )
    .all(teacherId);
}

export function getTeacherClassesWithStudents(teacherId: number) {
  const classes = db
    .prepare(
      `SELECT c.*, sy.name as school_year_name,
              s.name as subject_name, s.id as subject_id
       FROM teacher_assignment ta
       JOIN class c ON c.id = ta.class_id
       JOIN school_year sy ON sy.id = c.school_year_id
       JOIN subject s ON s.id = ta.subject_id
       WHERE ta.teacher_id = ?
       ORDER BY c.name, s.name`
    )
    .all(teacherId);

  for (const cls of classes) {
    const students = db
      .prepare(
        `SELECT u.id, u.first_name, u.last_name, u.username
         FROM class_enrollment ce
         JOIN user u ON u.id = ce.student_id
         WHERE ce.class_id = ?
         ORDER BY u.last_name, u.first_name`
      )
      .all(cls.id);
    cls.students = students;
  }
  return classes;
}

export function getTeacherClassesByTeacherId(teacherId: number, requesterRoles: string[]) {
  // Admin/principal can view any teacher's classes
  if (requesterRoles.includes("admin") || requesterRoles.includes("principal")) {
    return getTeacherClasses(teacherId);
  }
  // Teachers can only view their own classes
  if (requesterRoles.includes("teacher")) {
    // The service doesn't have requesterId here, but we can check in controller
    return getTeacherClasses(teacherId);
  }
  throw new Error("Non autorizzato");
}
