/**
 * Factory per creare rapidamente CRUD su una tabella SQLite.
 * Tutte le funzioni sono curry-bound a una specifica tabella.
 */
import db from "../db/connection";
import { NotFoundError } from "./errors";

type Row = Record<string, unknown>;

export function createCrud(tableName: string, pk = "id") {
  function list(): Row[] {
    return db.prepare(`SELECT * FROM ${tableName}`).all() as Row[];
  }

  function getById(id: number): Row {
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE ${pk} = ?`).get(id) as Row | undefined;
    if (!row) throw new NotFoundError(tableName);
    return row;
  }

  function create(data: Record<string, unknown>): Row {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const cols = keys.join(", ");

    const stmt = db.prepare(
      `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`
    );
    const result = stmt.run(...values);

    return getById(result.lastInsertRowid as number);
  }

  function update(id: number, data: Record<string, unknown>): Row {
    // Prima controlla che esista
    getById(id);

    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k) => `${k} = ?`).join(", ");

    const stmt = db.prepare(
      `UPDATE ${tableName} SET ${setClause} WHERE ${pk} = ?`
    );
    stmt.run(...values, id);

    return getById(id);
  }

  function remove(id: number): void {
    // Prima controlla che esista
    getById(id);

    db.prepare(`DELETE FROM ${tableName} WHERE ${pk} = ?`).run(id);
  }

  return { list, getById, create, update, remove };
}
