import { Router } from "express";
import * as ctrl from "./controller";
import { authenticate } from "../../middleware/auth";
import { authorize } from "../../middleware/rbac";

const router = Router();

router.use(authenticate);

// CRUD classi
router.get("/", authorize("admin", "principal", "teacher", "student"), ctrl.list);
router.get("/my-class", authorize("student"), ctrl.getMyClass);
router.get("/:id", authorize("admin", "principal", "teacher", "student"), ctrl.getById);
router.post("/", authorize("admin", "principal"), ctrl.create);
router.put("/:id", authorize("admin", "principal"), ctrl.update);
router.delete("/:id", authorize("admin"), ctrl.remove);

// Teacher classes (authenticated teacher)
router.get("/teacher/me", authorize("teacher"), ctrl.getMyClasses);
router.get("/teacher/me/with-students", authorize("teacher"), ctrl.getMyClassesWithStudents);

// Teacher classes by ID (admin/principal, or teacher for themselves)
router.get("/teachers/:id/classes", authorize("admin", "principal", "teacher"), ctrl.getTeacherClassesById);
router.get("/teachers/:id/classes/with-students", authorize("admin", "principal", "teacher"), ctrl.getTeacherClassesWithStudentsById);

// Assegnazione insegnanti
router.get("/:id/teachers", authorize("admin", "principal", "teacher"), ctrl.getTeacherAssignments);
router.post("/:id/teachers", authorize("admin", "principal"), ctrl.assignTeacher);
router.delete("/teachers/:assignmentId", authorize("admin", "principal"), ctrl.removeTeacherAssignment);

// Iscrizione studenti
router.get("/:id/students", authorize("admin", "principal", "teacher"), ctrl.getEnrollments);
router.post("/:id/students", authorize("admin", "principal"), ctrl.enrollStudent);
router.delete("/students/:enrollmentId", authorize("admin", "principal"), ctrl.removeEnrollment);

export default router;
