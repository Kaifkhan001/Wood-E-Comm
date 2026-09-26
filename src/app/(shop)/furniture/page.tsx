import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogSkeleton, CatalogView } from "@/components/shop/catalog-view";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Buy solid-wood furniture online",
  description: "Shop sofas, beds, dining sets, chairs, storage and tables in sheesham, teak, mango wood and cane. Free delivery and installation in Mumbai.",
  path: "/furniture",
});

export default async function Page({ searchParams }: PageProps<"/furniture">) {
  const sp = await searchParams;
  return (
    <Suspense key={JSON.stringify(sp)} fallback={<CatalogSkeleton />}>
      <CatalogView searchParams={sp} />
    </Suspense>
  );
}
