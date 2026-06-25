import { Router } from "express";
import * as ctrl from "./controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

// Role Permissions (granular)
router.get("/:id/permissions", ctrl.getRolePermissions);
router.post("/:id/permissions", ctrl.addRolePermission);
router.delete("/:id/permissions/:permissionId", ctrl.removeRolePermission);

// Permissions list
router.get("/permissions", ctrl.listPermissions);

export default router;
