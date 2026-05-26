import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@prisma/client";

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const PROTECTED_PAGES = [
  "/dashboard",
  "/workouts",
  "/library",
  "/calendar",
  "/social",
  "/messages",
  "/notifications",
  "/profile",
  "/support",
];

function startsWithAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const userStatus = auth?.user?.status;
      const path = nextUrl.pathname;

      if (startsWithAny(path, AUTH_PAGES)) {
        return true;
      }

      if (path.startsWith("/admin")) {
        return isLoggedIn && userRole === "ADMIN" && userStatus === "ACTIVE";
      }

      if (startsWithAny(path, PROTECTED_PAGES)) {
        return isLoggedIn && userStatus === "ACTIVE";
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as Role;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
