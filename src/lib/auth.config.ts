/**
 * Edge-safe Auth.js config — used by middleware.
 * MUST NOT import Prisma, bcrypt, or the database: middleware runs in the Edge
 * runtime, where PrismaClient throws at import. The full config (adapter +
 * credentials provider) lives in auth.ts and is used only in Node route handlers.
 */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [Google, Apple],
  callbacks: {
    jwt({ token, user }) {
      if (user && "role" in user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
  // pages.signIn intentionally unset: the default Auth.js sign-in page at
  // /api/auth/signin is used until a branded /login page ships (tracked in ledger).
} satisfies NextAuthConfig;
