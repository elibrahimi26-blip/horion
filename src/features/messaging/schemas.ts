import { z } from "zod";

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message vide")
    .max(2000, "2000 caractères maximum"),
});

export type MessageInput = z.infer<typeof messageSchema>;
