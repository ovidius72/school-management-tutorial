import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { config } from "../config";

const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: Database.Database = new Database(config.databasePath);

// Performance e integrità
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
