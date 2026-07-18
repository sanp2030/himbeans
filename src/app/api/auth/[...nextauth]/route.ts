/**
 * Auth.js (NextAuth v5) catch-all route — mounts the handlers built in
 * src/lib/auth.ts onto /api/auth/*.
 *
 * This file is the reason /api/auth/signin, /api/auth/signout,
 * /api/auth/session, and every OAuth callback URL exist at all. Without it,
 * the middleware's redirect to /api/auth/signin lands on a 404 — which is
 * exactly what happened on the first production deployment.
 *
 * Runs in the Node.js runtime (not Edge) because the full auth config uses
 * the Prisma adapter and bcrypt.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
