import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogSkeleton, CatalogView } from "@/components/shop/catalog-view";
import { getCategoryBySlug } from "@/lib/queries/catalog";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/furniture/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  return pageMeta({
    title: `${cat.name}: buy ${cat.name.toLowerCase()} online in India`,
    description: `${cat.description} Free delivery and installation in Mumbai, Thane and Pune.`,
    path: `/furniture/${cat.slug}`,
    image: cat.imageUrl ?? undefined,
  });
}

export default async function Page({ params, searchParams }: PageProps<"/furniture/[category]">) {
  const { category } = await params;
  // Existence check runs BEFORE anything streams, so unknown categories get a real 404 status.
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();
  const sp = await searchParams;
  return (
    <Suspense key={JSON.stringify(sp)} fallback={<CatalogSkeleton />}>
      <CatalogView searchParams={sp} category={cat} />
    </Suspense>
  );
}
