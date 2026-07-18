import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Only set the datasource URL override when one is actually present. Explicitly
// passing { url: undefined } makes Prisma's constructor throw immediately at
// import time — before any page has even tried to query anything — which took
// down unrelated routes during static build collection when DATABASE_URL was
// unset. Omitting the override lets Prisma fall back to schema.prisma's own
// env("DATABASE_URL") resolution, which fails lazily at first query instead,
// matching the try/catch pattern already used everywhere in this app.
const options: ConstructorParameters<typeof PrismaClient>[0] = {
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
};
if (process.env.DATABASE_URL) {
  options.datasources = { db: { url: process.env.DATABASE_URL } };
}

export const db = globalForPrisma.prisma ?? new PrismaClient(options);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
