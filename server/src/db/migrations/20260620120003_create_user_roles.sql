CREATE TABLE IF NOT EXISTS user_role (
  id_role INTEGER NOT NULL REFERENCES role(id),
  id_user INTEGER NOT NULL REFERENCES user(id),
  PRIMARY KEY (id_role, id_user)
);

CREATE INDEX IF NOT EXISTS idx_user_role_user ON user_role(id_user);
CREATE INDEX IF NOT EXISTS idx_user_role_role ON user_role(id_role);
