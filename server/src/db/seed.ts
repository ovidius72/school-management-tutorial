#!/usr/bin/env tsx
/**
 * Seed del database con dati casuali per sviluppo/test.
 */
import bcrypt from "bcryptjs";
import db from "./connection";
import { runMigrations } from "./migrate";

// Esegue migrazioni prima del seed
runMigrations();

function seed() {
  console.log("🌱 Seeding database...");

  // ── 1. Permessi ──
  const permissions = [
    { name: "users:read", description: "Leggere utenti" },
    { name: "users:write", description: "Creare/modificare utenti" },
    { name: "users:delete", description: "Eliminare utenti" },
    { name: "roles:read", description: "Leggere ruoli" },
    { name: "roles:write", description: "Creare/modificare ruoli" },
    { name: "roles:delete", description: "Eliminare ruoli" },
    { name: "school-years:read", description: "Leggere anni scolastici" },
    { name: "school-years:write", description: "Creare/modificare anni scolastici" },
    { name: "classes:read", description: "Leggere classi" },
    { name: "classes:write", description: "Creare/modificare classi" },
    { name: "subjects:read", description: "Leggere materie" },
    { name: "subjects:write", description: "Creare/modificare materie" },
    { name: "grades:read", description: "Leggere voti" },
    { name: "grades:write", description: "Inserire/modificare voti" },
    { name: "grades:delete", description: "Eliminare voti" },
    { name: "assignments:write", description: "Gestire assegnazioni insegnanti" },
    { name: "enrollments:write", description: "Gestire iscrizioni studenti" },
  ];

  const permStmt = db.prepare(
    "INSERT OR IGNORE INTO permission (name, description) VALUES (?, ?)"
  );
  for (const p of permissions) {
    permStmt.run(p.name, p.description);
  }

  // ── 2. Ruoli ──
  const roleData = [
    { name: "admin", description: "Amministratore — accesso completo" },
    { name: "principal", description: "Preside — gestione anni, classi, assegnazioni" },
    { name: "teacher", description: "Insegnante — gestione voti proprie materie" },
    { name: "student", description: "Studente — lettura classe e voti" },
  ];

  const roleStmt = db.prepare(
    "INSERT OR IGNORE INTO role (name, description) VALUES (?, ?)"
  );
  for (const r of roleData) {
    roleStmt.run(r.name, r.description);
  }

  // ── 3. Associa permessi ai ruoli ──
  const rolePermStmt = db.prepare(
    "INSERT OR IGNORE INTO role_permission (id_role, id_permission) VALUES (?, (SELECT id FROM permission WHERE name = ?))"
  );

  const adminRoleId = (db.prepare("SELECT id FROM role WHERE name = 'admin'").get() as any).id;
  const principalRoleId = (db.prepare("SELECT id FROM role WHERE name = 'principal'").get() as any).id;
  const teacherRoleId = (db.prepare("SELECT id FROM role WHERE name = 'teacher'").get() as any).id;
  const studentRoleId = (db.prepare("SELECT id FROM role WHERE name = 'student'").get() as any).id;

  // Admin: tutti i permessi
  for (const p of permissions) {
    rolePermStmt.run(adminRoleId, p.name);
  }

  // Principal: anni scolastici, classi, materie, assegnazioni
  for (const p of permissions) {
    if (p.name.startsWith("school-years:") ||
        p.name.startsWith("classes:") ||
        p.name.startsWith("subjects:") ||
        p.name === "assignments:write" ||
        p.name === "enrollments:write" ||
        p.name === "users:read") {
      rolePermStmt.run(principalRoleId, p.name);
    }
  }

  // Teacher: voti sulle proprie materie
  for (const p of permissions) {
    if (p.name === "grades:read" || p.name === "grades:write" || p.name === "grades:delete" ||
        p.name === "classes:read" || p.name === "subjects:read") {
      rolePermStmt.run(teacherRoleId, p.name);
    }
  }

  // Student: lettura classe e voti
  for (const p of permissions) {
    if (p.name === "classes:read" || p.name === "grades:read" || p.name === "subjects:read" ||
        p.name === "school-years:read") {
      rolePermStmt.run(studentRoleId, p.name);
    }
  }

  // ── 4. Utenti ──
  const pwHash = bcrypt.hashSync("password123", 10);

  const users = [
    { username: "admin", email: "admin@scuola.it", first_name: "Admin", last_name: "System", role: "admin" },
    { username: "preside", email: "preside@scuola.it", first_name: "Maria", last_name: "Rossi", role: "principal" },
    { username: "prof1", email: "prof1@scuola.it", first_name: "Giuseppe", last_name: "Verdi", role: "teacher" },
    { username: "prof2", email: "prof2@scuola.it", first_name: "Anna", last_name: "Bianchi", role: "teacher" },
    { username: "prof3", email: "prof3@scuola.it", first_name: "Marco", last_name: "Neri", role: "teacher" },
    { username: "studente1", email: "studente1@scuola.it", first_name: "Luca", last_name: "Ferrari", role: "student" },
    { username: "studente2", email: "studente2@scuola.it", first_name: "Sofia", last_name: "Romano", role: "student" },
    { username: "studente3", email: "studente3@scuola.it", first_name: "Alessandro", last_name: "Gallo", role: "student" },
    { username: "studente4", email: "studente4@scuola.it", first_name: "Giulia", last_name: "Costa", role: "student" },
    { username: "studente5", email: "studente5@scuola.it", first_name: "Matteo", last_name: "Fontana", role: "student" },
    { username: "studente6", email: "studente6@scuola.it", first_name: "Chiara", last_name: "Conti", role: "student" },
    { username: "studente7", email: "studente7@scuola.it", first_name: "Davide", last_name: "Moretti", role: "student" },
    { username: "studente8", email: "studente8@scuola.it", first_name: "Elena", last_name: "Barbieri", role: "student" },
    { username: "studente9", email: "studente9@scuola.it", first_name: "Francesco", last_name: "Marini", role: "student" },
    { username: "studente10", email: "studente10@scuola.it", first_name: "Valentina", last_name: "Greco", role: "student" },
  ];

  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO user (username, email, first_name, last_name, password_hash, dob, state, city, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const userRoleStmt = db.prepare(
    "INSERT OR IGNORE INTO user_role (id_role, id_user) VALUES (?, ?)"
  );

  const createdUserIds: Record<string, number> = {};

  for (const u of users) {
    const dob = new Date(
      1970 + Math.floor(Math.random() * 40),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    ).toISOString().split("T")[0];

    const cities = ["Roma", "Milano", "Napoli", "Torino", "Firenze", "Bologna", "Palermo", "Genova"];
    const states = ["Lazio", "Lombardia", "Campania", "Piemonte", "Toscana", "Emilia-Romagna", "Sicilia", "Liguria"];

    const result = userStmt.run(
      u.username, u.email, u.first_name, u.last_name, pwHash,
      dob,
      states[Math.floor(Math.random() * states.length)],
      cities[Math.floor(Math.random() * cities.length)],
      `${Math.floor(Math.random() * 200) + 1} Via Roma`
    );

    if (result.lastInsertRowid) {
      const userId = result.lastInsertRowid as number;
      createdUserIds[u.username] = userId;

      // Assegna ruolo
      const roleRow = db.prepare("SELECT id FROM role WHERE name = ?").get(u.role) as any;
      if (roleRow) {
        userRoleStmt.run(roleRow.id, userId);
      }
    }
  }

  // Releggi user ids per quelli già esistenti
  for (const u of users) {
    if (!createdUserIds[u.username]) {
      const row = db.prepare("SELECT id FROM user WHERE username = ?").get(u.username) as any;
      if (row) createdUserIds[u.username] = row.id;
    }
  }

  // ── 5. Anno scolastico ──
  const syResult = db.prepare(`
    INSERT OR IGNORE INTO school_year (name, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?)
  `).run("2025/2026", "2025-09-15", "2026-06-10", 1);

  let schoolYearId = (db.prepare("SELECT id FROM school_year WHERE name = '2025/2026'").get() as any)?.id;
  if (!schoolYearId) schoolYearId = syResult.lastInsertRowid as number;

  // ── 6. Materie ──
  const subjects = [
    { name: "Matematica", description: "Algebra, geometria, analisi" },
    { name: "Italiano", description: "Lingua e letteratura italiana" },
    { name: "Inglese", description: "Lingua e cultura inglese" },
    { name: "Scienze", description: "Scienze naturali e sperimentali" },
    { name: "Storia", description: "Storia e geografia" },
    { name: "Educazione Fisica", description: "Attività motorie e sportive" },
  ];

  const subjectStmt = db.prepare("INSERT OR IGNORE INTO subject (name, description) VALUES (?, ?)");
  for (const s of subjects) {
    subjectStmt.run(s.name, s.description);
  }

  const subjectIds: Record<string, number> = {};
  for (const s of subjects) {
    const row = db.prepare("SELECT id FROM subject WHERE name = ?").get(s.name) as any;
    if (row) subjectIds[s.name] = row.id;
  }

  // ── 7. Classi ──
  const classData = ["1A", "1B", "2A", "2B", "3A"];
  const classStmt = db.prepare("INSERT OR IGNORE INTO class (name, school_year_id) VALUES (?, ?)");
  const classIds: Record<string, number> = {};

  for (const cn of classData) {
    classStmt.run(cn, schoolYearId);
    const row = db.prepare("SELECT id FROM class WHERE name = ? AND school_year_id = ?").get(cn, schoolYearId) as any;
    if (row) classIds[cn] = row.id;
  }

  // ── 8. Assegnazioni insegnanti ──
  const teachers = [
    { username: "prof1", class: "1A", subjects: ["Matematica", "Scienze"] },
    { username: "prof1", class: "2A", subjects: ["Matematica"] },
    { username: "prof2", class: "1A", subjects: ["Italiano", "Storia"] },
    { username: "prof2", class: "1B", subjects: ["Italiano"] },
    { username: "prof3", class: "2A", subjects: ["Inglese", "Storia"] },
    { username: "prof3", class: "1B", subjects: ["Inglese", "Scienze"] },
  ];

  const taStmt = db.prepare(
    "INSERT OR IGNORE INTO teacher_assignment (teacher_id, class_id, subject_id) VALUES (?, ?, ?)"
  );

  for (const t of teachers) {
    const teacherId = createdUserIds[t.username];
    const classId = classIds[t.class];
    if (teacherId && classId) {
      for (const subj of t.subjects) {
        const subjId = subjectIds[subj];
        if (subjId) {
          taStmt.run(teacherId, classId, subjId);
        }
      }
    }
  }

  // ── 9. Iscrizioni studenti ──
  const enrollments = [
    { username: "studente1", class: "1A" },
    { username: "studente2", class: "1A" },
    { username: "studente3", class: "1B" },
    { username: "studente4", class: "1B" },
    { username: "studente5", class: "2A" },
    { username: "studente6", class: "2A" },
    { username: "studente7", class: "2B" },
    { username: "studente8", class: "2B" },
    { username: "studente9", class: "3A" },
    { username: "studente10", class: "3A" },
  ];

  const enrollStmt = db.prepare(
    "INSERT OR IGNORE INTO class_enrollment (class_id, student_id) VALUES (?, ?)"
  );

  for (const e of enrollments) {
    const studentId = createdUserIds[e.username];
    const classId = classIds[e.class];
    if (studentId && classId) {
      enrollStmt.run(classId, studentId);
    }
  }

  // ── 10. Voti casuali ──
  const subjectsArray = Object.values(subjectIds);
  const studentUsernames = users.filter((u) => u.role === "student").map((u) => u.username);
  const teacherUsernames = users.filter((u) => u.role === "teacher").map((u) => u.username);

  const gradeStmt = db.prepare(`
    INSERT INTO grade (student_id, teacher_id, subject_id, value, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const gradeDescriptions = [
    "Verifica scritta", "Interrogazione orale", "Compito in classe",
    "Laboratorio", "Esercitazione", "Progetto", "Test",
  ];

  for (const studentUsername of studentUsernames) {
    const studentId = createdUserIds[studentUsername];
    if (!studentId) continue;

    // Trova la classe dello studente
    const enrollment = db
      .prepare("SELECT class_id FROM class_enrollment WHERE student_id = ?")
      .get(studentId) as any;
    if (!enrollment) continue;

    // Trova insegnanti assegnati alla sua classe
    const teacherAssignments = db
      .prepare("SELECT teacher_id, subject_id FROM teacher_assignment WHERE class_id = ?")
      .all(enrollment.class_id) as any[];

    // Per ogni insegnante/materia, crea 3-6 voti
    for (const ta of teacherAssignments) {
      const numGrades = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numGrades; i++) {
        const value = parseFloat((4 + Math.random() * 6).toFixed(1));
        const desc = gradeDescriptions[Math.floor(Math.random() * gradeDescriptions.length)];
        gradeStmt.run(studentId, ta.teacher_id, ta.subject_id, value, desc);
      }
    }
  }

  console.log("✅ Seed completato!");
  console.log("");
  console.log("📋 Credenziali di default (password: password123):");
  console.log("   admin     → admin@scuola.it");
  console.log("   preside   → preside@scuola.it");
  console.log("   prof1     → prof1@scuola.it");
  console.log("   prof2     → prof2@scuola.it");
  console.log("   prof3     → prof3@scuola.it");
  console.log("   studente1 → studente1@scuola.it");
  console.log("   ... (fino a studente10)");
}

seed();
