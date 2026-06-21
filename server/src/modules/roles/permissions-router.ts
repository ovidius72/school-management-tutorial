import { Router } from "express";
import * as service from "./service";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";
import type { AuthenticatedRequest } from "../../types";
import type { Response } from "express";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", (_req: AuthenticatedRequest, res: Response) => {
  res.json(service.listPermissions());
});

export default router;
