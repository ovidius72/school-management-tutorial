import db from "../../db/connection";
import { ConflictError, NotFoundError } from "../../utils/errors";
import type { CreateSubjectInput, UpdateSubjectInput } from "./schema";

export function list() {
  return db.prepare("SELECT * FROM subject ORDER BY name").all();
}

export function getById(id: number) {
  const row = db.prepare("SELECT * FROM subject WHERE id = ?").get(id);
  if (!row) throw new NotFoundError("Materia");
  return row;
}

export function create(input: CreateSubjectInput) {
  const existing = db.prepare("SELECT id FROM subject WHERE name = ?").get(input.name);
  if (existing) throw new ConflictError("Materia già esistente");

  const result = db
    .prepare("INSERT INTO subject (name, description) VALUES (?, ?)")
    .run(input.name, input.description || null);

  return getById(result.lastInsertRowid as number);
}

export function update(id: number, input: UpdateSubjectInput) {
  getById(id);

  if (input.name !== undefined) {
    const existing = db.prepare("SELECT id FROM subject WHERE name = ? AND id != ?").get(input.name, id);
    if (existing) throw new ConflictError("Nome materia già in uso");
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) { fields.push("name = ?"); values.push(input.name); }
  if (input.description !== undefined) { fields.push("description = ?"); values.push(input.description); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE subject SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  return getById(id);
}

export function remove(id: number) {
  getById(id);
  db.transaction(() => {
    db.prepare("DELETE FROM grade WHERE subject_id = ?").run(id);
    db.prepare("DELETE FROM teacher_assignment WHERE subject_id = ?").run(id);
    db.prepare("DELETE FROM subject WHERE id = ?").run(id);
  })();
}
