"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./schemas";
import {
  generateToken,
  hashPassword,
  PASSWORD_RESET_EXPIRY_HOURS,
  tokenExpiry,
} from "./service";

export type AuthFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAuthState: AuthFormState = { status: "idle" };

// ────── Register ──────
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, username, password } = parsed.data;

  const [existingEmail, existingUsername] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { username } }),
  ]);

  if (existingEmail) {
    return { status: "error", error: "Cet email est déjà utilisé." };
  }
  if (existingUsername) {
    return { status: "error", error: "Ce pseudo est déjà pris." };
  }

  const passwordHash = await hashPassword(password);

  await db.user.create({
    data: {
      email,
      username,
      passwordHash,
      // role = MEMBER, status = PENDING (defaults)
    },
  });

  // TODO commit 3 : notifier l'admin par email

  redirect("/login?registered=true");
}

// ────── Login ──────
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        return {
          status: "error",
          error: "Identifiants invalides ou compte non encore activé.",
        };
      }
      return { status: "error", error: "Erreur de connexion." };
    }
    // NEXT_REDIRECT et autres : laisser remonter
    throw e;
  }

  return { status: "success" };
}

// ────── Logout ──────
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

// ────── Forgot password ──────
export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", error: "Email invalide." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Réponse uniforme pour éviter l'énumération d'emails
  if (!user) {
    return { status: "success" };
  }

  // Invalider les anciens tokens
  await db.verificationToken.deleteMany({
    where: { email: parsed.data.email, type: "password_reset" },
  });

  const token = generateToken();
  await db.verificationToken.create({
    data: {
      email: parsed.data.email,
      token,
      type: "password_reset",
      expiresAt: tokenExpiry(PASSWORD_RESET_EXPIRY_HOURS),
    },
  });

  // TODO commit 3 : envoyer l'email via Resend
  console.log(
    `[email stub] Reset link for ${parsed.data.email}: /reset-password?token=${token}`,
  );

  return { status: "success" };
}

// ────── Reset password ──────
export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tokenRow = await db.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (
    !tokenRow ||
    tokenRow.type !== "password_reset" ||
    tokenRow.expiresAt < new Date()
  ) {
    return {
      status: "error",
      error: "Lien expiré ou invalide. Refais une demande de réinitialisation.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.$transaction([
    db.user.update({
      where: { email: tokenRow.email },
      data: { passwordHash },
    }),
    db.verificationToken.delete({ where: { id: tokenRow.id } }),
  ]);

  redirect("/login?reset=true");
}
