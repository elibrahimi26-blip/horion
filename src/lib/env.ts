import { z } from "zod";

const emptyToUndefined = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().url().optional(),
);

const envSchema = z.object({
  // ── Core (required) ──
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // ── Cloudflare R2 ──
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_AVATARS: z.string().optional(),
  R2_BUCKET_EXERCISES: z.string().optional(),
  R2_BUCKET_BACKUPS: z.string().optional(),
  R2_PUBLIC_URL: emptyToUndefined,

  // ── Email (Resend) ──
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // ── Rate limit (Upstash) ──
  UPSTASH_REDIS_REST_URL: emptyToUndefined,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
