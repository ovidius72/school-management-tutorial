CREATE TABLE IF NOT EXISTS class_enrollment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES class(id),
  student_id INTEGER NOT NULL REFERENCES user(id)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_class ON class_enrollment(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON class_enrollment(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_unique ON class_enrollment(class_id, student_id);
