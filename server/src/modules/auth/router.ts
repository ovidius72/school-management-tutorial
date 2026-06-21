import { Router } from "express";
import * as ctrl from "./controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";

const router = Router();

// Pubblici
router.post("/login", ctrl.login);
router.post("/refresh", ctrl.refresh);

// Protetti
router.post("/logout", authenticate, ctrl.logout);
router.get("/me", authenticate, ctrl.me);

// CRUD utenti (admin/principal)
router.get("/users", authenticate, authorize("admin", "principal"), ctrl.listUsers);
router.get("/users/:id", authenticate, authorize("admin", "principal", "teacher"), ctrl.getUserById);
router.post("/users", authenticate, authorize("admin", "principal"), ctrl.createUser);
router.put("/users/:id", authenticate, authorize("admin", "principal"), ctrl.updateUser);
router.delete("/users/:id", authenticate, authorize("admin"), ctrl.deleteUser);

export default router;
