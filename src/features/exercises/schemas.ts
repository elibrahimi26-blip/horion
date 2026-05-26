import { z } from "zod";

export const exerciseFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "2 caractères minimum")
      .max(80, "80 caractères maximum"),
    description: z
      .string()
      .trim()
      .max(2000, "2000 caractères maximum")
      .optional()
      .nullable(),
    isCardio: z.boolean().default(false),
    estimatedSeconds: z
      .number()
      .int("Doit être un entier")
      .positive("Doit être positif")
      .nullable()
      .optional(),
    muscles: z
      .array(
        z.object({
          muscleGroupId: z.string().min(1),
          isPrimary: z.boolean(),
        }),
      )
      .min(1, "Sélectionne au moins un muscle"),
  })
  .refine(
    (data) => data.muscles.filter((m) => m.isPrimary).length === 1,
    {
      message: "Sélectionne exactement un muscle principal",
      path: ["muscles"],
    },
  );

export type ExerciseFormInput = z.infer<typeof exerciseFormSchema>;
