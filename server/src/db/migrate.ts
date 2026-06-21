#!/usr/bin/env tsx
/**
 * Migration runner.
 * Esegue i file SQL in src/db/migrations/ in ordine lessicale.
 * Tiene traccia delle migrazioni applicate nella tabella _migrations.
 */
import fs from "node:fs";
import path from "node:path";
import db from "./connection";

const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

function runMigrations() {
  // Crea tabella di tracking se non esiste
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Legge migrazioni già eseguite
  const applied = new Set(
    db
      .prepare("SELECT name FROM _migrations ORDER BY name")
      .all()
      .map((r: any) => r.name)
  );

  // Legge i file SQL in ordine
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    console.log(`🔄 Applying ${file}...`);

    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    })();

    console.log(`✅ Applied ${file}`);
  }

  console.log("🎉 All migrations up to date.");
}

// Esegui se chiamato direttamente
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
