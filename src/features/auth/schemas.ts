import { z } from "zod";

// ────── Primitives ──────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalide");

export const passwordSchema = z
  .string()
  .min(10, "10 caractères minimum")
  .max(100, "100 caractères maximum")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[0-9]/, "Au moins un chiffre");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "3 caractères minimum")
  .max(20, "20 caractères maximum")
  .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, _ et - uniquement");

// ────── Formulaires ──────

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token manquant"),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token manquant"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string().trim().max(500, "500 caractères maximum").optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
