import { Router } from "express";
import * as ctrl from "./controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);
router.get("/", authorize("admin", "principal", "teacher", "student"), ctrl.list);
router.get("/:id", authorize("admin", "principal", "teacher", "student"), ctrl.getById);
router.post("/", authorize("admin", "principal"), ctrl.create);
router.put("/:id", authorize("admin", "principal"), ctrl.update);
router.delete("/:id", authorize("admin"), ctrl.remove);

export default router;
