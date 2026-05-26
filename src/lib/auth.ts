import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { emailSchema } from "@/features/auth/schemas";

// Note : Auth.js v5 + Credentials provider impose la stratégie JWT
// (les DB sessions ne sont pas supportées nativement avec Credentials).
// L'architecture mentionne un modèle AuthSession en BDD — il reste
// disponible dans le schéma pour un futur tracking manuel des sessions
// actives (ex : "déconnecter tous les appareils"). À retravailler si besoin.

// On réutilise emailSchema (avec .toLowerCase()) pour normaliser
// l'email à l'authentification comme à l'inscription.
const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        // Compte non validé par admin ou suspendu
        if (user.status !== "ACTIVE") return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});
