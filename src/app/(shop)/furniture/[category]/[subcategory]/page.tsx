import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogSkeleton, CatalogView } from "@/components/shop/catalog-view";
import { getCategoryBySlug, getSubcategoryBySlug } from "@/lib/queries/catalog";
import { specFieldsFor } from "@/lib/catalog-options";
import { countActiveFilters } from "@/lib/validators";
import { pageMeta } from "@/lib/seo";

async function resolve(categorySlug: string, subcategorySlug: string) {
  const cat = await getCategoryBySlug(categorySlug);
  if (!cat) return null;
  const sub = await getSubcategoryBySlug(cat.id, subcategorySlug);
  if (!sub) return null;
  return { cat, sub };
}

export async function generateMetadata({ params, searchParams }: PageProps<"/furniture/[category]/[subcategory]">): Promise<Metadata> {
  const { category, subcategory } = await params;
  const resolved = await resolve(category, subcategory);
  if (!resolved) notFound();
  const { cat, sub } = resolved;
  const sp = await searchParams;
  const specKeys = specFieldsFor(cat.slug).filter((f) => f.filterable).map((f) => f.key);
  return pageMeta({
    title: `${sub.name}: buy ${sub.name.toLowerCase()} online in India`,
    description: sub.description || `${sub.name} from our ${cat.name.toLowerCase()} range. Free delivery and installation in Mumbai, Thane and Pune.`,
    path: `/furniture/${cat.slug}/${sub.slug}`,
    image: cat.imageUrl ?? undefined,
    noindexFollow: countActiveFilters(sp, specKeys) >= 2,
  });
}

export default async function Page({ params, searchParams }: PageProps<"/furniture/[category]/[subcategory]">) {
  const { category, subcategory } = await params;
  // Existence check runs BEFORE anything streams, so unknown category/subcategory
  // slugs get a real 404 status (src/proxy.ts also rejects these earlier, before
  // this component even runs, for the common case -- this is the fallback).
  const resolved = await resolve(category, subcategory);
  if (!resolved) notFound();
  const sp = await searchParams;
  return (
    <Suspense key={JSON.stringify(sp)} fallback={<CatalogSkeleton />}>
      <CatalogView searchParams={sp} category={resolved.cat} subcategory={resolved.sub} />
    </Suspense>
  );
}
