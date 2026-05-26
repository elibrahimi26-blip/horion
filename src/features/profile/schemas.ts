import { z } from "zod";
import { usernameSchema } from "@/features/auth/schemas";

export const updateUsernameSchema = z.object({
  username: usernameSchema,
});
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;

export const updateBioSchema = z.object({
  bio: z.string().trim().max(500, "500 caractères maximum"),
});
export type UpdateBioInput = z.infer<typeof updateBioSchema>;
