import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { log, requestId } from "@/lib/logger";

const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

/**
 * Admin menu management (MANAGER+) — the operational CRUD for the menu.
 * - GET    → full product list including inactive (admin sees everything)
 * - POST   → create product
 * - PATCH  → update product (price, description, availability, badge, …)
 * Deactivation is soft (isActive=false) — orders reference products, so hard
 * deletes are forbidden by design. Every mutation writes an AuditLog row.
 */

async function requireManager() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!role || !ADMIN_ROLES.includes(role)) return null;
  return { actorId: (session?.user as { id?: string } | undefined)?.id ?? null, role };
}

export async function GET() {
  const actor = await requireManager();
  if (!actor) return NextResponse.json({ error: "Manager access required." }, { status: 403 });
  try {
    const products = await db.product.findMany({
      orderBy: [{ category: { ordering: "asc" } }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Database unavailable", degraded: true }, { status: 503 });
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(120),
  description: z.string().min(2).max(500),
  price: z.number().positive().max(999),
  categoryId: z.string().min(1),
  calories: z.number().int().nonnegative().optional(),
  badge: z.enum(["BEST_SELLER", "POPULAR", "SEASONAL", "STRONG", "BARISTA_FAVORITE"]).nullable().optional(),
  allergens: z.array(z.string().max(40)).max(12).optional(),
  dietTags: z.array(z.string().max(40)).max(8).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const rid = requestId(req);
  const actor = await requireManager();
  if (!actor) return NextResponse.json({ error: "Manager access required." }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  try {
    const product = await db.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        categoryId: input.categoryId,
        calories: input.calories,
        badge: input.badge ?? null,
        allergens: input.allergens ?? [],
        dietTags: input.dietTags ?? [],
        ingredients: [],
        isActive: input.isActive ?? true,
        isFeatured: input.isFeatured ?? false,
      },
    });
    await audit({
      actorId: actor.actorId, action: "product.created", entity: "Product", entityId: product.id,
      meta: { name: product.name, price: String(product.price), slug: product.slug },
    });
    log("info", "admin.product_created", { rid, productId: product.id });
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A product with that slug already exists." }, { status: 409 });
    }
    log("error", "admin.product_create_failed", { rid, error: msg.slice(0, 200) });
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(2).max(500).optional(),
  price: z.number().positive().max(999).optional(),
  calories: z.number().int().nonnegative().nullable().optional(),
  badge: z.enum(["BEST_SELLER", "POPULAR", "SEASONAL", "STRONG", "BARISTA_FAVORITE"]).nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const rid = requestId(req);
  const actor = await requireManager();
  if (!actor) return NextResponse.json({ error: "Manager access required." }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { id, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  }

  try {
    const before = await db.product.findUnique({ where: { id }, select: { name: true, price: true, isActive: true } });
    if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const product = await db.product.update({ where: { id }, data: changes });
    await audit({
      actorId: actor.actorId, action: "product.updated", entity: "Product", entityId: id,
      meta: { changes: JSON.parse(JSON.stringify(changes)), previousPrice: String(before.price) },
    });
    log("info", "admin.product_updated", { rid, productId: id, fields: Object.keys(changes) });
    return NextResponse.json({ product });
  } catch (e) {
    log("error", "admin.product_update_failed", { rid, error: e instanceof Error ? e.message.slice(0, 200) : "" });
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}
