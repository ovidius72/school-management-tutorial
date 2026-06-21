import { z } from "zod";

export const schoolYearSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  start_date: z.string().min(1, "Data inizio richiesta"),
  end_date: z.string().min(1, "Data fine richiesta"),
  is_active: z.union([z.boolean(), z.number()]).optional().default(false),
});

export const schoolYearUpdateSchema = schoolYearSchema.partial();

export type SchoolYearInput = z.infer<typeof schoolYearSchema>;
export type SchoolYearUpdateInput = z.infer<typeof schoolYearUpdateSchema>;
