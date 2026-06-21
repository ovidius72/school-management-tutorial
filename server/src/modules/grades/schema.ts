import { z } from "zod";

export const createGradeSchema = z.object({
  student_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
  value: z.number().min(0).max(10, "Il voto deve essere tra 0 e 10"),
  description: z.string().optional().nullable(),
});

export const updateGradeSchema = createGradeSchema.partial();

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
