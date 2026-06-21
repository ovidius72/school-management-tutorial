CREATE TABLE IF NOT EXISTS role_permission (
  id_role INTEGER NOT NULL REFERENCES role(id),
  id_permission INTEGER NOT NULL REFERENCES permission(id),
  PRIMARY KEY (id_role, id_permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permission_role ON role_permission(id_role);
CREATE INDEX IF NOT EXISTS idx_role_permission_perm ON role_permission(id_permission);
