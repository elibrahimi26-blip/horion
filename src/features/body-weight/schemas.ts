import { z } from "zod";

export const bodyWeightSchema = z.object({
  weightKg: z
    .number()
    .positive("Doit être positif")
    .min(20, "Trop bas (min 20 kg)")
    .max(500, "Trop élevé (max 500 kg)"),
  recordedAt: z.date().max(new Date(Date.now() + 60_000), "Date dans le futur").optional(),
});

export type BodyWeightInput = z.infer<typeof bodyWeightSchema>;
