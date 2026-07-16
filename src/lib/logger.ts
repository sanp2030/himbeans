/**
 * Structured JSON logger with request IDs.
 * One line per event → trivially parseable by Vercel logs, Datadog, or Loki.
 * Swap the transport for pino/OpenTelemetry later without changing call sites.
 */
import { randomUUID } from "crypto";

type Level = "info" | "warn" | "error";

export function requestId(req?: Request): string {
  return req?.headers.get("x-request-id") ?? randomUUID().slice(0, 8);
}

export function log(level: Level, event: string, meta: Record<string, unknown> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
