import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Registro Elettronico — API",
    version: "1.0.0",
    description: `
Backend per la gestione di un registro elettronico scolastico.

## Autenticazione
- **Access token** (JWT, scade 15m) — passato via cookie httpOnly \`access_token\` **o** header \`Authorization: Bearer <token>\`
- **Refresh token** (UUID, scade 7gg) — passato via cookie httpOnly \`refresh_token\` **o** campo \`refreshToken\` nel body

## Ruoli
| Ruolo | Permessi |
|---|---|
| **admin** | Tutto |
| **principal** | Anni scolastici, classi, materie, assegnazioni, iscrizioni |
| **teacher** | CRUD voti solo per proprie materie/classi |
| **student** | Lettura classe e voti propri |
    `.trim(),
  },
  servers: [{ url: "http://localhost:3000", description: "Sviluppo locale" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          'Incolla qui il tuo access token JWT. Oppure usa il cookie httpOnly (automatico dopo login via Swagger).',
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Errore di validazione" },
          details: { type: "array", items: { type: "object" }, nullable: true },
        },
      },
      LoginInput: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: { type: "string", format: "password", example: "password123" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
          refreshToken: { type: "string", example: "uuid-refresh-token" },
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              username: { type: "string", example: "admin" },
              roles: { type: "array", items: { type: "string" }, example: ["admin"] },
            },
          },
        },
      },
      RefreshInput: {
        type: "object",
        properties: {
          refreshToken: { type: "string", example: "uuid-refresh-token" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          dob: { type: "string", format: "date", nullable: true },
          state: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          roles: { type: "array", items: { type: "string" } },
        },
      },
      CreateUserInput: {
        type: "object",
        required: ["username", "email", "first_name", "last_name", "password"],
        properties: {
          username: { type: "string", example: "nuovo.utente" },
          email: { type: "string", format: "email", example: "nuovo@scuola.it" },
          first_name: { type: "string", example: "Mario" },
          last_name: { type: "string", example: "Rossi" },
          password: { type: "string", format: "password", example: "password123" },
          dob: { type: "string", format: "date", example: "2000-01-15", nullable: true },
          state: { type: "string", example: "Lazio", nullable: true },
          city: { type: "string", example: "Roma", nullable: true },
          address: { type: "string", example: "Via Roma 10", nullable: true },
          roles: {
            type: "array",
            items: { type: "string" },
            example: ["student"],
            description: "Nomi dei ruoli da assegnare",
          },
        },
      },
      UpdateUserInput: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          password: { type: "string", format: "password" },
          dob: { type: "string", format: "date", nullable: true },
          state: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          roles: { type: "array", items: { type: "string" } },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          permissions: {
            type: "array",
            items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
          },
        },
      },
      CreateRoleInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "secretary" },
          description: { type: "string", example: "Segreteria didattica", nullable: true },
          permissions: {
            type: "array",
            items: { type: "integer" },
            example: [1, 2, 3],
            description: "IDs dei permessi",
          },
        },
      },
      SchoolYear: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", example: "2025/2026" },
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" },
          is_active: { type: "integer", example: 1 },
        },
      },
      SchoolYearInput: {
        type: "object",
        required: ["name", "start_date", "end_date"],
        properties: {
          name: { type: "string", example: "2026/2027" },
          start_date: { type: "string", format: "date", example: "2026-09-15" },
          end_date: { type: "string", format: "date", example: "2027-06-10" },
          is_active: { type: "boolean", example: true, description: "Se true, disattiva tutti gli altri anni" },
        },
      },
      Class: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", example: "1A" },
          school_year_id: { type: "integer" },
          school_year_name: { type: "string", example: "2025/2026" },
        },
      },
      CreateClassInput: {
        type: "object",
        required: ["name", "school_year_id"],
        properties: {
          name: { type: "string", example: "3B" },
          school_year_id: { type: "integer", example: 1 },
        },
      },
      Subject: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      CreateSubjectInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Fisica" },
          description: { type: "string", example: "Fisica e laboratorio", nullable: true },
        },
      },
      TeacherAssignment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          teacher_id: { type: "integer" },
          class_id: { type: "integer" },
          subject_id: { type: "integer" },
          teacher_name: { type: "string", example: "Giuseppe Verdi" },
          subject_name: { type: "string", example: "Matematica" },
        },
      },
      AssignTeacherInput: {
        type: "object",
        required: ["teacher_id", "subject_id"],
        properties: {
          teacher_id: { type: "integer", example: 3, description: "ID dell'insegnante" },
          subject_id: { type: "integer", example: 1, description: "ID della materia" },
        },
      },
      EnrollStudentInput: {
        type: "object",
        required: ["student_id"],
        properties: {
          student_id: { type: "integer", example: 6, description: "ID dello studente" },
        },
      },
      Enrollment: {
        type: "object",
        properties: {
          id: { type: "integer" },
          class_id: { type: "integer" },
          student_id: { type: "integer" },
          student_name: { type: "string", example: "Luca Ferrari" },
          username: { type: "string", example: "studente1" },
        },
      },
      Grade: {
        type: "object",
        properties: {
          id: { type: "integer" },
          student_id: { type: "integer" },
          teacher_id: { type: "integer" },
          subject_id: { type: "integer" },
          value: { type: "number", format: "float", example: 7.5 },
          description: { type: "string", nullable: true },
          created_at: { type: "string" },
          updated_at: { type: "string" },
          student_name: { type: "string" },
          teacher_name: { type: "string" },
          subject_name: { type: "string" },
        },
      },
      CreateGradeInput: {
        type: "object",
        required: ["student_id", "subject_id", "value"],
        properties: {
          student_id: { type: "integer", example: 6 },
          subject_id: { type: "integer", example: 1 },
          value: { type: "number", format: "float", example: 8.5, minimum: 0, maximum: 10 },
          description: { type: "string", example: "Verifica scritta", nullable: true },
        },
      },
      UpdateGradeInput: {
        type: "object",
        properties: {
          student_id: { type: "integer" },
          subject_id: { type: "integer" },
          value: { type: "number", format: "float", minimum: 0, maximum: 10 },
          description: { type: "string", nullable: true },
        },
      },
      Message: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operazione completata" },
        },
      },
      Permission: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      UserRole: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      SetUserRolesInput: {
        type: "object",
        required: ["roles"],
        properties: {
          roles: { type: "array", items: { type: "string" }, example: ["student", "teacher"] },
        },
      },
      AddUserRoleInput: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", example: "student" },
        },
      },
      AddRolePermissionInput: {
        type: "object",
        required: ["permissionId"],
        properties: {
          permissionId: { type: "integer", example: 1 },
        },
      },
      TeacherClass: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          school_year_id: { type: "integer" },
          school_year_name: { type: "string" },
          subject_name: { type: "string" },
          subject_id: { type: "integer" },
          students: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer" },
                first_name: { type: "string" },
                last_name: { type: "string" },
                username: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    // ─── Health ───────────────────────────────────────────
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Server attivo",
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, timestamp: { type: "string" } } } } },
          },
        },
      },
    },

    // ─── Auth ──────────────────────────────────────────────
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Autenticazione. Imposta i cookie httpOnly `access_token` e `refresh_token`.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } } },
        responses: {
          200: { description: "Login riuscito", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          401: { description: "Credenziali non valide", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh token",
        description: "Genera un nuovo pair (access+refresh) con token rotation. Il vecchio refresh token viene revocato.",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshInput" } } } },
        responses: {
          200: { description: "Nuovo token pair", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
          401: { description: "Refresh token non valido o scaduto" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Revoca il refresh token e pulisce i cookie.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Logout effettuato", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Profilo corrente",
        description: "Restituisce l'utente autenticato con i suoi ruoli.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Profilo utente", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Non autenticato" },
        },
      },
    },

    // ─── Users ────────────────────────────────────────────
    "/api/auth/users": {
      get: {
        tags: ["Users"],
        summary: "Elenco utenti (admin/principal)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Lista utenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
          403: { description: "Permessi insufficienti" },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Crea utente (admin/principal)",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserInput" } } } },
        responses: {
          201: { description: "Utente creato", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          400: { description: "Errore di validazione" },
          409: { description: "Username o email già in uso" },
        },
      },
    },
    "/api/auth/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Dettaglio utente",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Utente", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "Non trovato" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Modifica utente (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserInput" } } } },
        responses: {
          200: { description: "Utente aggiornato", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { description: "Non trovato" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Elimina utente (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Utente eliminato", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } },
          404: { description: "Non trovato" },
        },
      },
    },

    // ─── Roles ──────────────────────────────────────────
    "/api/roles": {
      get: {
        tags: ["Roles"],
        summary: "Elenco ruoli (admin)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Lista ruoli", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Role" } } } } },
        },
      },
      post: {
        tags: ["Roles"],
        summary: "Crea ruolo (admin)",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRoleInput" } } } },
        responses: {
          201: { description: "Ruolo creato", content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } },
          409: { description: "Ruolo già esistente" },
        },
      },
    },
    "/api/roles/{id}": {
      get: {
        tags: ["Roles"],
        summary: "Dettaglio ruolo (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Ruolo", content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } } } },
      },
      put: {
        tags: ["Roles"],
        summary: "Modifica ruolo (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRoleInput" } } } },
        responses: { 200: { description: "Ruolo aggiornato" } },
      },
      delete: {
        tags: ["Roles"],
        summary: "Elimina ruolo (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Ruolo eliminato", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },

    // ─── School Years ────────────────────────────────────
    "/api/school-years": {
      get: {
        tags: ["School Years"],
        summary: "Elenco anni scolastici",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/SchoolYear" } } } } } },
      },
      post: {
        tags: ["School Years"],
        summary: "Crea anno scolastico (admin/principal)",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SchoolYearInput" } } } },
        responses: { 201: { description: "Creato", content: { "application/json": { schema: { $ref: "#/components/schemas/SchoolYear" } } } } },
      },
    },
    "/api/school-years/{id}": {
      get: {
        tags: ["School Years"],
        summary: "Dettaglio anno scolastico",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Anno scolastico", content: { "application/json": { schema: { $ref: "#/components/schemas/SchoolYear" } } } } },
      },
      put: {
        tags: ["School Years"],
        summary: "Modifica anno scolastico (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SchoolYearInput" } } } },
        responses: { 200: { description: "Aggiornato" } },
      },
      delete: {
        tags: ["School Years"],
        summary: "Elimina anno scolastico (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Eliminato", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },

    // ─── Classes ───────────────────────────────────────
    "/api/classes": {
      get: {
        tags: ["Classes"],
        summary: "Elenco classi",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Class" } } } } } },
      },
      post: {
        tags: ["Classes"],
        summary: "Crea classe (admin/principal)",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateClassInput" } } } },
        responses: { 201: { description: "Classe creata", content: { "application/json": { schema: { $ref: "#/components/schemas/Class" } } } } },
      },
    },
    "/api/classes/my-class": {
      get: {
        tags: ["Classes"],
        summary: "Classe dello studente autenticato",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Classe", content: { "application/json": { schema: { $ref: "#/components/schemas/Class" } } } } },
      },
    },
    "/api/classes/{id}": {
      get: {
        tags: ["Classes"],
        summary: "Dettaglio classe",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Classe", content: { "application/json": { schema: { $ref: "#/components/schemas/Class" } } } } },
      },
      put: {
        tags: ["Classes"],
        summary: "Modifica classe (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateClassInput" } } } },
        responses: { 200: { description: "Aggiornata" } },
      },
      delete: {
        tags: ["Classes"],
        summary: "Elimina classe (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Eliminata", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },
    "/api/classes/{id}/teachers": {
      get: {
        tags: ["Classes — Teacher Assignments"],
        summary: "Assegnazioni insegnanti per classe",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID classe" }],
        responses: { 200: { description: "Lista assegnazioni", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/TeacherAssignment" } } } } } },
      },
      post: {
        tags: ["Classes — Teacher Assignments"],
        summary: "Assegna insegnante a classe/materia (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID classe" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AssignTeacherInput" } } } },
        responses: { 201: { description: "Assegnazione creata" } },
      },
    },
    "/api/classes/teachers/{assignmentId}": {
      delete: {
        tags: ["Classes — Teacher Assignments"],
        summary: "Rimuovi assegnazione insegnante (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "assignmentId", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Assegnazione rimossa", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },
    "/api/classes/{id}/students": {
      get: {
        tags: ["Classes — Enrollments"],
        summary: "Iscritti alla classe",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Lista iscrizioni", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Enrollment" } } } } } },
      },
      post: {
        tags: ["Classes — Enrollments"],
        summary: "Iscrivi studente (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EnrollStudentInput" } } } },
        responses: { 201: { description: "Iscritto" } },
      },
    },
    "/api/classes/students/{enrollmentId}": {
      delete: {
        tags: ["Classes — Enrollments"],
        summary: "Rimuovi iscrizione (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "enrollmentId", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Iscrizione rimossa", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },

    // ─── Subjects ─────────────────────────────────────
    "/api/subjects": {
      get: {
        tags: ["Subjects"],
        summary: "Elenco materie",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Subject" } } } } } },
      },
      post: {
        tags: ["Subjects"],
        summary: "Crea materia (admin/principal)",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSubjectInput" } } } },
        responses: { 201: { description: "Materia creata", content: { "application/json": { schema: { $ref: "#/components/schemas/Subject" } } } } },
      },
    },
    "/api/subjects/{id}": {
      get: {
        tags: ["Subjects"],
        summary: "Dettaglio materia",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Materia" } },
      },
      put: {
        tags: ["Subjects"],
        summary: "Modifica materia (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSubjectInput" } } } },
        responses: { 200: { description: "Aggiornata" } },
      },
      delete: {
        tags: ["Subjects"],
        summary: "Elimina materia (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Eliminata", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },

    // ─── Grades ──────────────────────────────────────
    "/api/grades": {
      get: {
        tags: ["Grades"],
        summary: "Elenco voti (admin/principal/teacher)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista voti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Grade" } } } } } },
      },
      post: {
        tags: ["Grades"],
        summary: "Inserisci voto (teacher)",
        description: "L'insegnante può inserire voti solo per materie/classi a cui è assegnato.",
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateGradeInput" } } } },
        responses: { 201: { description: "Voto creato", content: { "application/json": { schema: { $ref: "#/components/schemas/Grade" } } } } },
      },
    },
    "/api/grades/my": {
      get: {
        tags: ["Grades"],
        summary: "Miei voti",
        description: "Dispatcher automatico in base al ruolo: studente → propri voti, insegnante → voti inseriti, admin/principal → array vuoto.",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Voti (in base al ruolo)", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Grade" } } } } } },
      },
    },
    "/api/grades/my-taught": {
      get: {
        tags: ["Grades"],
        summary: "Voti inseriti (teacher)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Voti dell'insegnante", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Grade" } } } } } },
      },
    },
    "/api/grades/{id}": {
      get: {
        tags: ["Grades"],
        summary: "Dettaglio voto",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Voto", content: { "application/json": { schema: { $ref: "#/components/schemas/Grade" } } } } },
      },
      put: {
        tags: ["Grades"],
        summary: "Modifica voto (teacher — solo propri)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateGradeInput" } } } },
        responses: { 200: { description: "Voto aggiornato" } },
      },
      delete: {
        tags: ["Grades"],
        summary: "Elimina voto (teacher — solo propri)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Voto eliminato", content: { "application/json": { schema: { $ref: "#/components/schemas/Message" } } } } },
      },
    },

    // ─── User Grades ────────────────────────────
    "/api/user/{id}/grades": {
      get: {
        tags: ["User Grades"],
        summary: "Voti di un utente",
        description: "Admin/principal → voti di qualsiasi studente. Teacher → voti degli studenti nelle proprie classi. Studente → solo i propri.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID dello studente" }],
        responses: {
          200: {
            description: "Voti dello studente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    student: { type: "object", properties: { id: { type: "integer" }, first_name: { type: "string" }, last_name: { type: "string" } } },
                    grades: { type: "array", items: { $ref: "#/components/schemas/Grade" } },
                  },
                },
              },
            },
          },
          403: { description: "Accesso negato" },
          404: { description: "Studente non trovato" },
        },
      },
    },

    // ─── Permissions ────────────────────────────────
    "/api/permissions": {
      get: {
        tags: ["Permissions"],
        summary: "Elenco permessi (admin)",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista permessi", content: { "application/json": { schema: { type: "array", items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, description: { type: "string" } } } } } } } },
      },
    },

    // ─── User Roles ───────────────────────────────
    "/api/auth/users/{id}/roles": {
      get: {
        tags: ["Users — Roles"],
        summary: "Ruoli di un utente",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Lista ruoli", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserRole" } } } } } },
      },
      put: {
        tags: ["Users — Roles"],
        summary: "Sostituisci tutti i ruoli (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SetUserRolesInput" } } } },
        responses: { 200: { description: "Ruoli aggiornati", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserRole" } } } } } },
      },
      post: {
        tags: ["Users — Roles"],
        summary: "Aggiungi ruolo a utente (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AddUserRoleInput" } } } },
        responses: { 200: { description: "Ruolo aggiunto", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserRole" } } } } } },
      },
      delete: {
        tags: ["Users — Roles"],
        summary: "Rimuovi ruolo da utente (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "role", in: "path", required: true, schema: { type: "string" }, description: "Nome del ruolo" }
        ],
        responses: { 200: { description: "Ruolo rimosso", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserRole" } } } } } },
      },
    },

    // ─── User Permissions ─────────────────────────
    "/api/auth/users/{id}/permissions": {
      get: {
        tags: ["Users — Permissions"],
        summary: "Permessi effettivi di un utente (computed)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Lista permessi", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Permission" } } } } } },
      },
    },

    // ─── Role Permissions (granular) ──────────────
    "/api/roles/{id}/permissions": {
      get: {
        tags: ["Roles — Permissions"],
        summary: "Permessi di un ruolo",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Lista permessi", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Permission" } } } } } },
      },
      post: {
        tags: ["Roles — Permissions"],
        summary: "Aggiungi permesso a ruolo (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AddRolePermissionInput" } } } },
        responses: { 200: { description: "Permesso aggiunto", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Permission" } } } } } },
      },
      delete: {
        tags: ["Roles — Permissions"],
        summary: "Rimuovi permesso da ruolo (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "permissionId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: { 200: { description: "Permesso rimosso", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Permission" } } } } } },
      },
    },

    // ─── Teacher Classes ──────────────────────────
    "/api/classes/teacher/me": {
      get: {
        tags: ["Classes — Teacher"],
        summary: "Classi dell'insegnante autenticato",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista classi con materia", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/TeacherClass" } } } } } },
      },
    },
    "/api/classes/teacher/me/with-students": {
      get: {
        tags: ["Classes — Teacher"],
        summary: "Classi dell'insegnante con studenti iscritti",
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: "Lista classi con studenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/TeacherClass" } } } } } },
      },
    },
    "/api/classes/teachers/{id}/classes": {
      get: {
        tags: ["Classes — Teacher"],
        summary: "Classi di un insegnante specifico (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID insegnante" }],
        responses: { 200: { description: "Lista classi con materia", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/TeacherClass" } } } } } },
      },
    },
    "/api/classes/teachers/{id}/classes/with-students": {
      get: {
        tags: ["Classes — Teacher"],
        summary: "Classi di un insegnante con studenti (admin/principal)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID insegnante" }],
        responses: { 200: { description: "Lista classi con studenti", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/TeacherClass" } } } } } },
      },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "Registro Elettronico — API Docs",
      customfavIcon: "https://swagger.io/favicon.ico",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: { theme: "monokai" },
      },
    })
  );

  // JSON raw spec
  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
  });

  console.log(`📖 Swagger UI: http://localhost:${process.env.PORT || 3000}/api-docs`);
}
