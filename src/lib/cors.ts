/**
 * CORS bridge for external storefronts (e.g. the Base44 site) to use this
 * platform as their commerce engine. SCOPE: public commerce endpoints only
 * (locations, order create, order tracking). Ops APIs (/api/pos, /api/admin)
 * are deliberately NOT CORS-enabled — staff surfaces stay same-origin.
 *
 * Allowlist via PUBLIC_CORS_ORIGINS (comma-separated exact origins), e.g.:
 *   PUBLIC_CORS_ORIGINS="https://classic-peak-bean-brew.base44.app,https://himbean.coffee"
 * Unset = no cross-origin access (safe default).
 */
import { NextResponse } from "next/server";

function allowlist(): string[] {
  return (process.env.PUBLIC_CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowlist().includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Standard OPTIONS preflight response for public commerce routes. */
export function preflight(req: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

/** Attach CORS headers to an existing response. */
export function withCors<T extends NextResponse>(req: Request, res: T): T {
  for (const [k, v] of Object.entries(corsHeaders(req.headers.get("origin")))) res.headers.set(k, v);
  return res;
}
