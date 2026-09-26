import "server-only";
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, projects } from "@/db/schema";
import type { Filters } from "@/lib/validators";

export const PAGE_SIZE = 12;

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

// Escape LIKE wildcards so user text is always matched literally.
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

function buildWhere(f: Filters, categoryId?: string) {
  const conds: SQL[] = [eq(products.isActive, true)];
  if (categoryId) conds.push(eq(products.categoryId, categoryId));
  if (f.q) {
    const term = `%${likeEscape(f.q)}%`;
    conds.push(or(ilike(products.name, term), ilike(products.material, term), ilike(products.shortDescription, term))!);
  }
  if (f.min !== undefined) conds.push(gte(products.price, f.min));
  if (f.max !== undefined) conds.push(lte(products.price, f.max));
  if (f.material.length) conds.push(inArray(products.material, f.material));
  if (f.inStock) conds.push(gt(products.stock, 0));
  return and(...conds)!;
}

const sortMap = {
  featured: [desc(products.isFeatured), desc(products.createdAt)],
  "price-asc": [asc(products.price), asc(products.name)],
  "price-desc": [desc(products.price), asc(products.name)],
  newest: [desc(products.createdAt)],
} as const;

export async function getProducts(f: Filters, categoryId?: string) {
  const where = buildWhere(f, categoryId);
  const [{ total }] = await db.select({ total: count() }).from(products).where(where);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  const items = await db.query.products.findMany({
    where,
    orderBy: [...sortMap[f.sort]],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    with: {
      images: { orderBy: [asc(productImages.position)], limit: 2 },
      category: { columns: { name: true, slug: true } },
    },
  });
  return { items, total, page, pages };
}

/** Materials available in the current category (ignores other filters so options don't vanish). */
export async function getMaterialFacets(categoryId?: string) {
  const conds = [eq(products.isActive, true)];
  if (categoryId) conds.push(eq(products.categoryId, categoryId));
  return db
    .select({ material: products.material, n: count() })
    .from(products)
    .where(and(...conds))
    .groupBy(products.material)
    .orderBy(asc(products.material));
}

export async function getPriceBounds(categoryId?: string) {
  const conds = [eq(products.isActive, true)];
  if (categoryId) conds.push(eq(products.categoryId, categoryId));
  const [r] = await db
    .select({ min: sql<number>`coalesce(min(${products.price}),0)::int`, max: sql<number>`coalesce(max(${products.price}),0)::int` })
    .from(products)
    .where(and(...conds));
  return r;
}

export async function getProductBySlug(slug: string) {
  return (
    (await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: { images: { orderBy: [asc(productImages.position)] }, category: true },
    })) ?? null
  );
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
  return db.query.products.findMany({
    where: and(eq(products.categoryId, categoryId), ne(products.id, excludeId), eq(products.isActive, true)),
    orderBy: [desc(products.isFeatured), desc(products.createdAt)],
    limit,
    with: { images: { orderBy: [asc(productImages.position)], limit: 2 }, category: { columns: { name: true, slug: true } } },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return db.query.products.findMany({
    where: and(eq(products.isActive, true), eq(products.isFeatured, true)),
    orderBy: [desc(products.createdAt)],
    limit,
    with: { images: { orderBy: [asc(productImages.position)], limit: 2 }, category: { columns: { name: true, slug: true } } },
  });
}

/** Public cart lookup: returns only public fields for active products. */
export async function getCartProducts(ids: string[]) {
  if (!ids.length) return [];
  return db.query.products.findMany({
    where: and(inArray(products.id, ids), eq(products.isActive, true)),
    columns: { id: true, name: true, slug: true, price: true, mrp: true, stock: true },
    with: { images: { orderBy: [asc(productImages.position)], limit: 1 } },
  });
}

export async function getProjects(limit?: number) {
  const q = db.select().from(projects).where(eq(projects.isPublished, true)).orderBy(asc(projects.position), desc(projects.createdAt));
  return limit ? q.limit(limit) : q;
}

export async function getProjectBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.isPublished, true)))
    .limit(1);
  return row ?? null;
}

export type ProductCardData = Awaited<ReturnType<typeof getFeaturedProducts>>[number];
