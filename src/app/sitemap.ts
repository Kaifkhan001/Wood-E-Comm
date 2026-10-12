import type { MetadataRoute } from "next";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, projects, subcategories } from "@/db/schema";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/furniture`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/interior-design`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/get-a-quote`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const [cats, subcats, prods, projs] = await Promise.all([
      db.select({ slug: categories.slug }).from(categories),
      // Only subcategories with at least one active product get a sitemap entry.
      db
        .select({ categorySlug: categories.slug, slug: subcategories.slug, n: count(products.id) })
        .from(subcategories)
        .innerJoin(categories, eq(subcategories.categoryId, categories.id))
        .innerJoin(products, and(eq(products.subcategoryId, subcategories.id), eq(products.isActive, true)))
        .groupBy(subcategories.id, categories.slug),
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
      db.select({ slug: projects.slug, createdAt: projects.createdAt }).from(projects).where(eq(projects.isPublished, true)),
    ]);
    return [
      ...staticPages,
      ...cats.map((c) => ({ url: `${base}/furniture/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
      ...subcats.map((s) => ({ url: `${base}/furniture/${s.categorySlug}/${s.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
      ...prods.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...projs.map((p) => ({ url: `${base}/interior-design/${p.slug}`, lastModified: p.createdAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    return staticPages;
  }
}
