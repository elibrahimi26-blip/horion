import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nom requis")
    .max(40, "40 caractères maximum"),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Format hex requis (ex : #FF5733)"),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
