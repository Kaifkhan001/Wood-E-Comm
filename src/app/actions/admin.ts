"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { categories, contactMessages, orderItems, orders, productImages, products, quoteRequests, orderStatusEnum, quoteStatusEnum } from "@/db/schema";
import { assertAdmin } from "@/lib/session";
import { destroyAsset } from "@/lib/cloudinary";
import { categorySchema, productSchema, zodErrors, type ActionResult } from "@/lib/validators";

const GENERIC = "Couldn't save. Please try again.";
const uuid = z.uuid();

async function gate(): Promise<ActionResult | null> {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false, error: "You don't have permission to do that." };
  }
}

function isUniqueViolation(e: unknown) {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === "23505" || err?.cause?.code === "23505";
}

function revalidateCatalog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/furniture", "layout");
  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/sitemap.xml");
}

/* ── Products ── */
export async function saveProduct(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await gate();
  if (denied) return denied;
  if (id && !uuid.safeParse(id).success) return { ok: false, error: "Invalid product." };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
  const { images, ...data } = parsed.data;
  if (data.mrp && data.mrp < data.price) return { ok: false, error: "MRP can't be lower than the selling price.", fieldErrors: { mrp: "Must be at least the price" } };
  if (images.some((i) => !i.publicId && !i.url)) return { ok: false, error: "One of the images is missing." };

  try {
    const { pid: productId, removed } = await db.transaction(async (tx) => {
      let pid = id;
      let removedPublicIds: string[] = [];
      if (pid) {
        const old = await tx.select({ publicId: productImages.publicId }).from(productImages).where(eq(productImages.productId, pid));
        const keep = new Set(images.map((i) => i.publicId).filter(Boolean));
        removedPublicIds = old.map((o) => o.publicId).filter((p): p is string => Boolean(p) && !keep.has(p));
        const upd = await tx.update(products).set({ ...data, mrp: data.mrp || null, updatedAt: new Date() }).where(eq(products.id, pid)).returning({ id: products.id });
        if (!upd.length) throw new Error("NOT_FOUND");
        await tx.delete(productImages).where(eq(productImages.productId, pid));
      } else {
        const [row] = await tx.insert(products).values({ ...data, mrp: data.mrp || null }).returning({ id: products.id });
        pid = row.id;
      }
      if (images.length) {
        await tx.insert(productImages).values(images.map((img, i) => ({ productId: pid!, publicId: img.publicId ?? null, url: img.url ?? null, alt: img.alt || data.name, position: i })));
      }
      return { pid: pid!, removed: removedPublicIds };
    });
    // Clean up Cloudinary assets only after the transaction committed.
    removed.forEach((p) => void destroyAsset(p));
    revalidateCatalog(data.slug);
    revalidatePath("/admin/products");
    return { ok: true, data: { id: productId }, message: "Product saved" };
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: "That URL slug is already used by another product.", fieldErrors: { slug: "Already in use" } };
    if ((e as Error).message === "NOT_FOUND") return { ok: false, error: "This product no longer exists." };
    console.error("saveProduct", e);
    return { ok: false, error: GENERIC };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid product." };
  try {
    const imgs = await db.select({ publicId: productImages.publicId }).from(productImages).where(eq(productImages.productId, id));
    // Products that appear in orders are archived (hidden), never hard-deleted.
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(orderItems).where(eq(orderItems.productId, id));
    if (n > 0) {
      await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
      revalidateCatalog();
      revalidatePath("/admin/products");
      return { ok: true, message: "This product has orders, so it was hidden from the store instead of deleted." };
    }
    const [del] = await db.delete(products).where(eq(products.id, id)).returning({ slug: products.slug });
    imgs.forEach((i) => i.publicId && void destroyAsset(i.publicId));
    revalidateCatalog(del?.slug);
    revalidatePath("/admin/products");
    return { ok: true, message: "Product deleted" };
  } catch (e) {
    console.error("deleteProduct", e);
    return { ok: false, error: GENERIC };
  }
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid product." };
  const [row] = await db.update(products).set({ isActive: Boolean(isActive), updatedAt: new Date() }).where(eq(products.id, id)).returning({ slug: products.slug });
  revalidateCatalog(row?.slug);
  revalidatePath("/admin/products");
  return { ok: true };
}

/* ── Categories ── */
export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  if (id && !uuid.safeParse(id).success) return { ok: false, error: "Invalid category." };
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
  const data = { ...parsed.data, imageUrl: parsed.data.imageUrl || null };
  try {
    if (id) await db.update(categories).set(data).where(eq(categories.id, id));
    else await db.insert(categories).values(data);
    revalidateCatalog();
    revalidatePath("/admin/categories");
    return { ok: true, message: "Category saved" };
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already in use" } };
    console.error("saveCategory", e);
    return { ok: false, error: GENERIC };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid category." };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, id));
  if (n > 0) return { ok: false, error: `Move or delete the ${n} products in this category first.` };
  await db.delete(categories).where(eq(categories.id, id));
  revalidateCatalog();
  revalidatePath("/admin/categories");
  return { ok: true, message: "Category deleted" };
}

/* ── Orders ── */
const orderStatus = z.enum(orderStatusEnum.enumValues);

export async function updateOrder(id: string, input: { status: unknown; adminNotes?: unknown }): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  const status = orderStatus.safeParse(input.status);
  if (!uuid.safeParse(id).success || !status.success) return { ok: false, error: "Invalid update." };
  const notes = typeof input.adminNotes === "string" ? input.adminNotes.replace(/<[^>]*>/g, "").slice(0, 2000) : undefined;

  try {
    const res = await db.transaction(async (tx) => {
      const [o] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).for("update");
      if (!o) return "Order not found.";
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
      const reserved = (s: string) => !["requested", "cancelled"].includes(s);
      const wasReserved = reserved(o.status);
      const willReserve = reserved(status.data);

      // Stock is reserved when an order is confirmed and released if it's cancelled.
      if (!wasReserved && willReserve) {
        for (const it of items) {
          if (!it.productId) continue;
          const upd = await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${it.quantity}` })
            .where(and(eq(products.id, it.productId), sql`${products.stock} >= ${it.quantity}`))
            .returning({ id: products.id });
          if (!upd.length) throw new Error(`STOCK:${it.productName}`);
        }
      } else if (wasReserved && !willReserve) {
        for (const it of items) {
          if (it.productId) await tx.update(products).set({ stock: sql`${products.stock} + ${it.quantity}` }).where(eq(products.id, it.productId));
        }
      }
      await tx.update(orders).set({ status: status.data, ...(notes !== undefined ? { adminNotes: notes } : {}), updatedAt: new Date() }).where(eq(orders.id, id));
      return null;
    });
    if (res) return { ok: false, error: res };
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin");
    revalidateCatalog();
    return { ok: true, message: "Order updated" };
  } catch (e) {
    const m = (e as Error).message;
    if (m.startsWith("STOCK:")) return { ok: false, error: `Not enough stock for "${m.slice(6)}". Update stock first.` };
    console.error("updateOrder", e);
    return { ok: false, error: GENERIC };
  }
}

/* ── Quotes & messages ── */
const quoteStatus = z.enum(quoteStatusEnum.enumValues);

export async function updateQuote(id: string, input: { status: unknown; adminNotes?: unknown }): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  const status = quoteStatus.safeParse(input.status);
  if (!uuid.safeParse(id).success || !status.success) return { ok: false, error: "Invalid update." };
  const notes = typeof input.adminNotes === "string" ? input.adminNotes.replace(/<[^>]*>/g, "").slice(0, 2000) : undefined;
  await db.update(quoteRequests).set({ status: status.data, ...(notes !== undefined ? { adminNotes: notes } : {}) }).where(eq(quoteRequests.id, id));
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
  return { ok: true, message: "Quote updated" };
}

export async function setMessagesResolved(ids: string[], resolved: boolean): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return denied;
  const valid = ids.filter((i) => uuid.safeParse(i).success).slice(0, 100);
  if (!valid.length) return { ok: false, error: "Nothing selected." };
  await db.update(contactMessages).set({ isResolved: Boolean(resolved) }).where(inArray(contactMessages.id, valid));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { ok: true };
}
