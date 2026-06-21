import db from "../../db/connection";
import { ConflictError, NotFoundError } from "../../utils/errors";
import type { SchoolYearInput, SchoolYearUpdateInput } from "./schema";

export function list() {
  return db.prepare("SELECT * FROM school_year ORDER BY start_date DESC").all();
}

export function getById(id: number) {
  const row = db.prepare("SELECT * FROM school_year WHERE id = ?").get(id);
  if (!row) throw new NotFoundError("Anno scolastico");
  return row;
}

export function create(input: SchoolYearInput) {
  const isActive = input.is_active === true || input.is_active === 1 ? 1 : 0;

  // Se questo è l'anno attivo, disattiva tutti gli altri
  if (isActive) {
    db.prepare("UPDATE school_year SET is_active = 0").run();
  }

  const result = db
    .prepare("INSERT INTO school_year (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)")
    .run(input.name, input.start_date, input.end_date, isActive);

  return getById(result.lastInsertRowid as number);
}

export function update(id: number, input: SchoolYearUpdateInput) {
  getById(id); // exists check

  if (input.is_active !== undefined) {
    const isActive = input.is_active === true || input.is_active === 1 ? 1 : 0;
    if (isActive) {
      db.prepare("UPDATE school_year SET is_active = 0").run();
    }
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { fields.push("name = ?"); values.push(input.name); }
  if (input.start_date !== undefined) { fields.push("start_date = ?"); values.push(input.start_date); }
  if (input.end_date !== undefined) { fields.push("end_date = ?"); values.push(input.end_date); }
  if (input.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(input.is_active === true || input.is_active === 1 ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE school_year SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return getById(id);
}

export function remove(id: number) {
  getById(id);
  // Prima elimina classi collegate
  db.transaction(() => {
    const classes = db.prepare("SELECT id FROM class WHERE school_year_id = ?").all(id) as any[];
    for (const cls of classes) {
      db.prepare("DELETE FROM class_enrollment WHERE class_id = ?").run(cls.id);
      db.prepare("DELETE FROM teacher_assignment WHERE class_id = ?").run(cls.id);
      db.prepare("DELETE FROM grade WHERE subject_id IN (SELECT id FROM subject) AND student_id IN (SELECT student_id FROM class_enrollment WHERE class_id = ?)").run(cls.id);
      db.prepare("DELETE FROM class WHERE id = ?").run(cls.id);
    }
    db.prepare("DELETE FROM school_year WHERE id = ?").run(id);
  })();
}
