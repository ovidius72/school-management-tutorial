import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Nome classe richiesto"),
  school_year_id: z.number().int().positive(),
});

export const updateClassSchema = createClassSchema.partial();

export const assignTeacherSchema = z.object({
  teacher_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
});

export const enrollStudentSchema = z.object({
  student_id: z.number().int().positive(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
