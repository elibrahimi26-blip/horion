import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

export const BCRYPT_COST = 12;
export const EMAIL_VERIFY_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;
export const MAX_USERNAME_CHANGES = 2;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function tokenExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
