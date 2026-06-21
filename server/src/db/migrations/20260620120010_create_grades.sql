CREATE TABLE IF NOT EXISTS grade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES user(id),
  teacher_id INTEGER NOT NULL REFERENCES user(id),
  subject_id INTEGER NOT NULL REFERENCES subject(id),
  value REAL NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_grade_student ON grade(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_teacher ON grade(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_subject ON grade(subject_id);
