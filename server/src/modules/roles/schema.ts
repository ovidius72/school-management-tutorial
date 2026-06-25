import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, "Nome richiesto").max(50),
  description: z.string().optional().nullable(),
  permissions: z.array(z.number().int().positive()).optional().default([]),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
