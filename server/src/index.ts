import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { runMigrations } from "./db/migrate";
import { errorHandler } from "./middleware/error-handler";
import { authenticate } from "./middleware/auth";
import { authorize } from "./middleware/rbac";

// Routes
import authRouter from "./modules/auth/router";
import rolesRouter from "./modules/roles/router";
import schoolYearsRouter from "./modules/school-years/router";
import classesRouter from "./modules/classes/router";
import subjectsRouter from "./modules/subjects/router";
import gradesRouter from "./modules/grades/router";
import * as gradeController from "./modules/grades/controller";
import * as roleService from "./modules/roles/service";

// Swagger
import { setupSwagger } from "./swagger";

// Esegui migrazioni all'avvio
runMigrations();

const app = express();

// Middleware globali
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/school-years", schoolYearsRouter);
app.use("/api/classes", classesRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/grades", gradesRouter);

// Voti di un utente specifico
app.get(
  "/api/user/:id/grades",
  authenticate,
  authorize("admin", "principal", "teacher", "student"),
  gradeController.getUserGradesCtrl
);

// Permissions (admin solo lettura)
app.get(
  "/api/permissions",
  authenticate,
  authorize("admin"),
  (_req, res) => {
    res.json(roleService.listPermissions());
  }
);

// Swagger UI
setupSwagger(app);

// Error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Server avviato su http://localhost:${config.port}`);
  console.log(`   Database: ${config.databasePath}`);
  console.log(`   📖 Swagger: http://localhost:${config.port}/api-docs`);
});
