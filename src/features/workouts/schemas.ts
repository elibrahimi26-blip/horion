import { z } from "zod";

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  orderIndex: z.number().int().min(0),
  targetSets: z
    .number()
    .int("Doit être un entier")
    .min(1, "Au moins 1 série")
    .max(20, "20 séries maximum"),
  targetReps: z.string().trim().max(20, "20 caractères max").nullable().optional(),
  targetWeightKg: z
    .number()
    .nonnegative("Doit être ≥ 0")
    .max(1000, "1000 kg maximum")
    .nullable()
    .optional(),
  restSeconds: z
    .number()
    .int()
    .min(0, "Doit être ≥ 0")
    .max(900, "15 minutes maximum")
    .nullable()
    .optional(),
  notes: z.string().trim().max(500, "500 caractères max").nullable().optional(),
});

export const workoutFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "2 caractères minimum")
    .max(80, "80 caractères maximum"),
  description: z
    .string()
    .trim()
    .max(2000, "2000 caractères maximum")
    .nullable()
    .optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, "Ajoute au moins un exercice"),
});

export type WorkoutFormInput = z.infer<typeof workoutFormSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;
