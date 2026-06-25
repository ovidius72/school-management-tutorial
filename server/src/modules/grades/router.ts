import { Router, type Request, type Response, type NextFunction } from "express";
import * as ctrl from "./controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import type { AuthenticatedRequest } from "../../types";

const router = Router();

// 🔐 Tutte le route richiedono autenticazione
router.use(authenticate);

// ─── Miei voti (funziona per student, teacher) ───
// Dispatcher automatico in base al ruolo
router.get("/my", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user!;
  if (user.roles.includes("student")) {
    return ctrl.getMyGrades(req, res, next);
  }
  if (user.roles.includes("teacher")) {
    return ctrl.getTeacherGradesCtrl(req, res, next);
  }
  // Admin/Principal: "my grades" non applicabile, restituisce array vuoto
  return res.json([]);
});

// Vista insegnante: voti inseriti
router.get("/my-taught", authorize("teacher"), ctrl.getTeacherGradesCtrl);

// CRUD voti
router.get("/", authorize("admin", "principal", "teacher"), ctrl.list);
router.get("/:id", authorize("admin", "principal", "teacher", "student"), ctrl.getById);
router.post("/", authorize("teacher"), ctrl.create);
router.put("/:id", authorize("teacher"), ctrl.update);
router.delete("/:id", authorize("teacher"), ctrl.remove);

export default router;
