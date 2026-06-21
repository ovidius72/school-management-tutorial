import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Nome materia richiesto").max(100),
  description: z.string().optional().nullable(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
