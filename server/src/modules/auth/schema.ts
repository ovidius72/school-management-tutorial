import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username richiesto"),
  password: z.string().min(1, "Password richiesta"),
});

export const createUserSchema = z.object({
  username: z.string().min(3, "Username minimo 3 caratteri").max(50),
  email: z.string().email("Email non valida"),
  first_name: z.string().min(1, "Nome richiesto"),
  last_name: z.string().min(1, "Cognome richiesto"),
  password: z.string().min(6, "Password minimo 6 caratteri"),
  dob: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  roles: z.array(z.string()).optional().default([]),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
