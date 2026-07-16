/**
 * Environment validation — fails fast at boot with a readable error
 * instead of a cryptic runtime crash mid-request.
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
if (!parsed.success && process.env.NODE_ENV === "production") {
  console.error("❌ Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — see log above.");
}

export const env = parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof schema>);
