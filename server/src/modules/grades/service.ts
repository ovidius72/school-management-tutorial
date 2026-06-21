import db from "../../db/connection";
import { NotFoundError, ForbiddenError } from "../../utils/errors";
import type { CreateGradeInput, UpdateGradeInput } from "./schema";

export function list() {
  return db
    .prepare(
      `SELECT g.*,
              u.first_name || ' ' || u.last_name as student_name,
              t.first_name || ' ' || t.last_name as teacher_name,
              s.name as subject_name
       FROM grade g
       JOIN user u ON u.id = g.student_id
       JOIN user t ON t.id = g.teacher_id
       JOIN subject s ON s.id = g.subject_id
       ORDER BY g.created_at DESC`
    )
    .all();
}

export function getById(id: number) {
  const row = db
    .prepare(
      `SELECT g.*,
              u.first_name || ' ' || u.last_name as student_name,
              t.first_name || ' ' || t.last_name as teacher_name,
              s.name as subject_name
       FROM grade g
       JOIN user u ON u.id = g.student_id
       JOIN user t ON t.id = g.teacher_id
       JOIN subject s ON s.id = g.subject_id
       WHERE g.id = ?`
    )
    .get(id);
  if (!row) throw new NotFoundError("Voto");
  return row;
}

export function create(input: CreateGradeInput, teacherId: number) {
  // Verifica che l'insegnante sia assegnato a quella materia per la classe dello studente
  const enrollment = db
    .prepare(
      `SELECT ce.class_id FROM class_enrollment ce WHERE ce.student_id = ?`
    )
    .get(input.student_id) as any;

  if (!enrollment) throw new NotFoundError("Studente non iscritto a nessuna classe");

  const assignment = db
    .prepare(
      `SELECT id FROM teacher_assignment
       WHERE teacher_id = ? AND class_id = ? AND subject_id = ?`
    )
    .get(teacherId, enrollment.class_id, input.subject_id) as any;

  if (!assignment) {
    throw new ForbiddenError("Non sei assegnato a questa materia per la classe dello studente");
  }

  const result = db
    .prepare(
      "INSERT INTO grade (student_id, teacher_id, subject_id, value, description) VALUES (?, ?, ?, ?, ?)"
    )
    .run(input.student_id, teacherId, input.subject_id, input.value, input.description || null);

  return getById(result.lastInsertRowid as number);
}

export function update(id: number, input: UpdateGradeInput, teacherId: number) {
  const grade = getById(id);
  if ((grade as any).teacher_id !== teacherId) {
    throw new ForbiddenError("Puoi modificare solo i tuoi voti");
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.student_id !== undefined) { fields.push("student_id = ?"); values.push(input.student_id); }
  if (input.subject_id !== undefined) { fields.push("subject_id = ?"); values.push(input.subject_id); }
  if (input.value !== undefined) { fields.push("value = ?"); values.push(input.value); }
  if (input.description !== undefined) { fields.push("description = ?"); values.push(input.description); }

  fields.push("updated_at = datetime('now')");

  if (fields.length > 1) {
    values.push(id);
    db.prepare(`UPDATE grade SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return getById(id);
}

export function remove(id: number, teacherId: number) {
  const grade = getById(id);
  if ((grade as any).teacher_id !== teacherId) {
    throw new ForbiddenError("Puoi eliminare solo i tuoi voti");
  }
  db.prepare("DELETE FROM grade WHERE id = ?").run(id);
}

// Per studenti: i propri voti
export function getStudentGrades(studentId: number) {
  return db
    .prepare(
      `SELECT g.*, s.name as subject_name, t.first_name || ' ' || t.last_name as teacher_name
       FROM grade g
       JOIN subject s ON s.id = g.subject_id
       JOIN user t ON t.id = g.teacher_id
       WHERE g.student_id = ?
       ORDER BY s.name, g.created_at DESC`
    )
    .all(studentId);
}

// Per insegnante: voti delle proprie materie
// Per admin/principal: voti di un qualsiasi studente
// Per teacher: voti degli studenti delle proprie classi
function canAccessStudentGrades(requesterId: number, studentId: number, requesterRoles: string[]): boolean {
  // Admin/principal: tutto
  if (requesterRoles.includes("admin") || requesterRoles.includes("principal")) {
    return true;
  }
  // Studente: solo i propri voti
  if (requesterRoles.includes("student")) {
    return requesterId === studentId;
  }
  // Teacher: solo studenti nelle proprie classi
  if (requesterRoles.includes("teacher")) {
    const match = db
      .prepare(
        `SELECT 1 FROM teacher_assignment ta
         JOIN class_enrollment ce ON ce.class_id = ta.class_id
         WHERE ta.teacher_id = ? AND ce.student_id = ?
         LIMIT 1`
      )
      .get(requesterId, studentId);
    return !!match;
  }
  return false;
}

export function getUserGrades(studentId: number, requesterId: number, requesterRoles: string[]) {
  if (requesterRoles.includes("student") && requesterId !== studentId) {
    throw new ForbiddenError("Puoi vedere solo i tuoi voti");
  }

  if (!canAccessStudentGrades(requesterId, studentId, requesterRoles)) {
    throw new ForbiddenError("Non hai accesso ai voti di questo studente");
  }

  const student = db.prepare("SELECT id, first_name, last_name FROM user WHERE id = ?").get(studentId) as any;
  if (!student) throw new NotFoundError("Studente");

  const grades = db
    .prepare(
      `SELECT g.*, s.name as subject_name, t.first_name || ' ' || t.last_name as teacher_name
       FROM grade g
       JOIN subject s ON s.id = g.subject_id
       JOIN user t ON t.id = g.teacher_id
       WHERE g.student_id = ?
       ORDER BY s.name, g.created_at DESC`
    )
    .all(studentId);

  return {
    student: { id: student.id, first_name: student.first_name, last_name: student.last_name },
    grades,
  };
}

export function getTeacherGrades(teacherId: number) {
  return db
    .prepare(
      `SELECT g.*,
              s.name as subject_name,
              u.first_name || ' ' || u.last_name as student_name
       FROM grade g
       JOIN subject s ON s.id = g.subject_id
       JOIN user u ON u.id = g.student_id
       WHERE g.teacher_id = ?
       ORDER BY g.created_at DESC`
    )
    .all(teacherId);
}
