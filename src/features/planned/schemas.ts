import { z } from "zod";

export const plannedSessionSchema = z.object({
  workoutId: z.string().min(1, "Choisis une séance"),
  scheduledFor: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format YYYY-MM-DD"),
  categoryId: z.string().nullable().optional(),
  notes: z.string().trim().max(500, "500 caractères max").nullable().optional(),
});

export type PlannedSessionInput = z.infer<typeof plannedSessionSchema>;
