import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "3 caractères minimum")
    .max(100, "100 caractères maximum"),
  body: z
    .string()
    .trim()
    .min(10, "10 caractères minimum")
    .max(2000, "2000 caractères maximum"),
});

export const supportReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message vide")
    .max(2000, "2000 caractères maximum"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type SupportReplyInput = z.infer<typeof supportReplySchema>;
