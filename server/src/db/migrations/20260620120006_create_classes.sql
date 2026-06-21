CREATE TABLE IF NOT EXISTS class (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  school_year_id INTEGER NOT NULL REFERENCES school_year(id),
  UNIQUE(name, school_year_id)
);

CREATE INDEX IF NOT EXISTS idx_class_school_year ON class(school_year_id);
