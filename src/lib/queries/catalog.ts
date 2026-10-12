import "server-only";
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lte, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, projects, subcategories } from "@/db/schema";
import type { Filters } from "@/lib/validators";

export const PAGE_SIZE = 12;

/** Which category/subcategory a catalog query is scoped to -- both optional
 * (the all-furniture page passes neither). */
export type Scope = { categoryId?: string; subcategoryId?: string };

export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

export async function getSubcategoryBySlug(categoryId: string, slug: string) {
  const [row] = await db.select().from(subcategories).where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.slug, slug))).limit(1);
  return row ?? null;
}

/** Subcategories of a category that have at least one active product, with that count,
 * for the chip row on the category page (chips with zero products are hidden). */
export async function getSubcategoriesWithCounts(categoryId: string) {
  return db
    .select({ id: subcategories.id, name: subcategories.name, slug: subcategories.slug, n: count(products.id) })
    .from(subcategories)
    .innerJoin(products, and(eq(products.subcategoryId, subcategories.id), eq(products.isActive, true)))
    .where(eq(subcategories.categoryId, categoryId))
    .groupBy(subcategories.id)
    .orderBy(asc(subcategories.position), asc(subcategories.name));
}

// Escape LIKE wildcards so user text is always matched literally.
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

function scopeConds(scope: Scope): SQL[] {
  const conds: SQL[] = [eq(products.isActive, true)];
  if (scope.categoryId) conds.push(eq(products.categoryId, scope.categoryId));
  if (scope.subcategoryId) conds.push(eq(products.subcategoryId, scope.subcategoryId));
  return conds;
}

/** Builds `specs->>'key' = 'value'` conditions -- `specFilters` keys/values are
 * validated by the caller (catalog-view.tsx) against the category's filterable
 * spec fields before reaching here, so this is always a safe, parameterised
 * equality check, never raw user SQL. */
function specConds(specFilters: Record<string, string> | undefined): SQL[] {
  if (!specFilters) return [];
  return Object.entries(specFilters).map(([key, value]) => sql`${products.specs}->>${key} = ${value}`);
}

function buildWhere(f: Filters, scope: Scope, specFilters?: Record<string, string>) {
  const conds = scopeConds(scope);
  if (f.q) {
    const term = `%${likeEscape(f.q)}%`;
    conds.push(or(ilike(products.name, term), ilike(products.material, term), ilike(products.shortDescription, term))!);
  }
  if (f.min !== undefined) conds.push(gte(products.price, f.min));
  if (f.max !== undefined) conds.push(lte(products.price, f.max));
  if (f.material.length) conds.push(inArray(products.material, f.material));
  if (f.inStock) conds.push(gt(products.stock, 0));
  conds.push(...specConds(specFilters));
  return and(...conds)!;
}

const sortMap = {
  featured: [desc(products.isFeatured), desc(products.createdAt)],
  "price-asc": [asc(products.price), asc(products.name)],
  "price-desc": [desc(products.price), asc(products.name)],
  newest: [desc(products.createdAt)],
} as const;

export async function getProducts(f: Filters, scope: Scope = {}, specFilters?: Record<string, string>) {
  const where = buildWhere(f, scope, specFilters);
  const [{ total }] = await db.select({ total: count() }).from(products).where(where);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  const items = await db.query.products.findMany({
    where,
    orderBy: [...sortMap[f.sort]],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    with: {
      images: { orderBy: [asc(productImages.position)], limit: 4 },
      category: { columns: { name: true, slug: true } },
    },
  });
  return { items, total, page, pages };
}

/** Materials available in the current scope (ignores other filters so options don't vanish). */
export async function getMaterialFacets(scope: Scope = {}) {
  return db
    .select({ material: products.material, n: count() })
    .from(products)
    .where(and(...scopeConds(scope)))
    .groupBy(products.material)
    .orderBy(asc(products.material));
}

export async function getPriceBounds(scope: Scope = {}) {
  const [r] = await db
    .select({ min: sql<number>`coalesce(min(${products.price}),0)::int`, max: sql<number>`coalesce(max(${products.price}),0)::int` })
    .from(products)
    .where(and(...scopeConds(scope)));
  return r;
}

/** Facet counts for one filterable spec field (e.g. how many active products have
 * each `seatingCapacity` value), ignoring other spec filters so options don't
 * vanish as soon as one is picked -- same behaviour as material facets. */
export async function getSpecFacets(scope: Scope, key: string) {
  // Grouped/ordered by output position (1), not by repeating the `specs->>key`
  // expression -- Postgres treats each `${key}` placeholder as a distinct
  // parameter node, so a repeated expression with its own placeholder doesn't
  // syntactically match the one in SELECT and gets rejected ("must appear in
  // the GROUP BY clause") even though the bound value is identical.
  return db
    .select({ value: sql<string>`${products.specs}->>${key}`, n: count() })
    .from(products)
    .where(and(...scopeConds(scope), sql`${products.specs} ? ${key}`))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
}

export async function getProductBySlug(slug: string) {
  return (
    (await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: { images: { orderBy: [asc(productImages.position)] }, category: true, subcategory: true },
    })) ?? null
  );
}

/** Related products for the product page's "More X" rail: prefers the same
 * subcategory (falling back to filling the rest from the category) so it
 * reads as "More 3 Seater Sofas" rather than just "More Sofas" when possible. */
export async function getRelatedProducts(categoryId: string, excludeId: string, subcategoryId?: string | null, limit = 4) {
  if (subcategoryId) {
    const subItems = await db.query.products.findMany({
      where: and(eq(products.subcategoryId, subcategoryId), ne(products.id, excludeId), eq(products.isActive, true)),
      orderBy: [desc(products.isFeatured), desc(products.createdAt)],
      limit,
      with: { images: { orderBy: [asc(productImages.position)], limit: 4 }, category: { columns: { name: true, slug: true } } },
    });
    if (subItems.length >= limit) return subItems;
    const exclude = [excludeId, ...subItems.map((p) => p.id)];
    const rest = await db.query.products.findMany({
      where: and(eq(products.categoryId, categoryId), notInArray(products.id, exclude), eq(products.isActive, true)),
      orderBy: [desc(products.isFeatured), desc(products.createdAt)],
      limit: limit - subItems.length,
      with: { images: { orderBy: [asc(productImages.position)], limit: 4 }, category: { columns: { name: true, slug: true } } },
    });
    return [...subItems, ...rest];
  }
  return db.query.products.findMany({
    where: and(eq(products.categoryId, categoryId), ne(products.id, excludeId), eq(products.isActive, true)),
    orderBy: [desc(products.isFeatured), desc(products.createdAt)],
    limit,
    with: { images: { orderBy: [asc(productImages.position)], limit: 4 }, category: { columns: { name: true, slug: true } } },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return db.query.products.findMany({
    where: and(eq(products.isActive, true), eq(products.isFeatured, true)),
    orderBy: [desc(products.createdAt)],
    limit,
    with: { images: { orderBy: [asc(productImages.position)], limit: 4 }, category: { columns: { name: true, slug: true } } },
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
