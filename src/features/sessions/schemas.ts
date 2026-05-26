import { z } from "zod";

export const setLogSchema = z.object({
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  setNumber: z.number().int().min(1).max(50),
  weightKg: z
    .number()
    .nonnegative()
    .max(1000, "1000 kg maximum")
    .nullable()
    .optional(),
  reps: z.number().int().min(0).max(500).nullable().optional(),
  durationSec: z
    .number()
    .int()
    .min(0)
    .max(7200, "120 min maximum")
    .nullable()
    .optional(),
  restSec: z
    .number()
    .int()
    .min(0)
    .max(3600, "60 min maximum")
    .nullable()
    .optional(),
});

export type SetLogInput = z.infer<typeof setLogSchema>;
