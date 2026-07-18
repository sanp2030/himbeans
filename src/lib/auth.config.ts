/**
 * Edge-safe Auth.js config — used by middleware.
 * MUST NOT import Prisma, bcrypt, or the database: middleware runs in the Edge
 * runtime, where PrismaClient throws at import. The full config (adapter +
 * credentials provider) lives in auth.ts and is used only in Node route handlers.
 */
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";

// OAuth providers are gated behind their env keys — the same pattern as
// Stripe/Resend/Twilio everywhere else in this app. Without gating, the
// default sign-in page renders a Google/Apple button that errors on click
// when the keys were never configured.
const oauthProviders = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
  ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET ? [Apple] : []),
];

export const authConfig = {
  session: { strategy: "jwt" },
  // Vercel serves production and preview deployments from changing hostnames
  // (himbeans.vercel.app, himbeans-git-main-*.vercel.app). trustHost tells
  // Auth.js to accept the incoming Host header instead of rejecting requests
  // from hosts it doesn't recognize. Safe on Vercel, where the platform
  // controls the Host header.
  trustHost: true,
  providers: oauthProviders,
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
