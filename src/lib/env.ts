/**
 * Environment validation — fails fast on real server boot / first request
 * with a readable error instead of a cryptic runtime crash mid-request.
 *
 * Deliberately does NOT throw during `next build`'s static page-data-collection
 * phase (NEXT_PHASE === "phase-production-build"). That phase touches every
 * route for static analysis — including ones that never read the database,
 * like /privacy or Next's own /_not-found — so a build-time throw here would
 * block the entire deployment over env vars that specific page doesn't need.
 * Real misconfiguration is still caught immediately once the server actually
 * starts serving traffic.
 */
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid Postgres URL" }),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars (openssl rand -base64 32)"),
  AUTH_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!parsed.success && process.env.NODE_ENV === "production" && !isBuildPhase) {
  console.error("❌ Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — see log above.");
}
if (!parsed.success && isBuildPhase) {
  console.warn(
    "⚠️  Environment incomplete during build (expected if DATABASE_URL/AUTH_SECRET aren't set yet):",
    parsed.error.flatten().fieldErrors
  );
}

export const env = parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof schema>);

