CREATE TABLE IF NOT EXISTS teacher_assignment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL REFERENCES user(id),
  class_id INTEGER NOT NULL REFERENCES class(id),
  subject_id INTEGER NOT NULL REFERENCES subject(id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignment_teacher ON teacher_assignment(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_class ON teacher_assignment(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_assignment_unique ON teacher_assignment(teacher_id, class_id, subject_id);
