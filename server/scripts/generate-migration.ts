#!/usr/bin/env tsx
/**
 * Genera un file di migrazione con prefisso timestamp.
 * Uso: tsx scripts/generate-migration.ts <nome_descrittivo>
 * Esempio: tsx scripts/generate-migration.ts create_students_table
 */
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../src/db/migrations");

function main() {
  const args = process.argv.slice(2);
  const name = args[0] || "unnamed_migration";

  // Genera timestamp: YYYYMMDDHHmmss
  const now = new Date();
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const filename = `${ts}_${name}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const template = `-- Migration: ${name}
-- Created at: ${now.toISOString()}

-- Scrivi qui le tue query SQL
-- Esempio:
-- CREATE TABLE IF NOT EXISTS example (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL UNIQUE
-- );
`;

  fs.writeFileSync(filepath, template, "utf-8");
  console.log(`✅ Migrazione creata: ${filename}`);
  console.log(`   Percorso: ${filepath}`);
}

main();
