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

// User Roles (admin/principal)
router.get("/users/:id/roles", authenticate, authorize("admin", "principal"), ctrl.getUserRoles);
router.put("/users/:id/roles", authenticate, authorize("admin", "principal"), ctrl.setUserRoles);
router.post("/users/:id/roles", authenticate, authorize("admin", "principal"), ctrl.addUserRole);
router.delete("/users/:id/roles/:role", authenticate, authorize("admin", "principal"), ctrl.removeUserRole);

// User Effective Permissions (admin/principal)
router.get("/users/:id/permissions", authenticate, authorize("admin", "principal"), ctrl.getUserPermissions);

export default router;
