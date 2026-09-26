import Link from "next/link";
import { Suspense } from "react";
import { filterSchema } from "@/lib/validators";
import { getCategories, getMaterialFacets, getPriceBounds, getProducts } from "@/lib/queries/catalog";
import { FilterSidebar, Toolbar } from "./filters";
import { ProductGrid } from "./product-card";
import { cn } from "@/lib/utils";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";
import type { Category } from "@/db/schema";

type SP = Record<string, string | string[] | undefined>;

export async function CatalogView({ searchParams, category }: { searchParams: SP; category?: Category }) {
  const filters = filterSchema.parse(searchParams);
  const [cats, { items, total, page, pages }, materials, bounds] = await Promise.all([
    getCategories(),
    getProducts(filters, category?.id),
    getMaterialFacets(category?.id),
    getPriceBounds(category?.id),
  ]);

  const basePath = category ? `/furniture/${category.slug}` : "/furniture";
  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && k !== "page" && k !== "focus") qs.set(k, v);
    if (n > 1) qs.set("page", String(n));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="container-x pt-8 lg:pt-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Furniture", path: "/furniture" },
          ...(category ? [{ name: category.name, path: basePath }] : []),
        ])}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
          <li>{category ? <><Link href="/furniture" className="hover:text-ink">Furniture</Link> /</> : <span aria-current="page">Furniture</span>}</li>
          {category && <li aria-current="page" className="text-ink">{category.name}</li>}
        </ol>
      </nav>

      <header className="mt-5 max-w-2xl">
        <h1 className="text-[40px] leading-[1.05] sm:text-[56px]">{category ? category.name : "All furniture"}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          {category ? category.description : "Solid-wood furniture made in our own workshop. Free delivery and installation in Mumbai, Thane and Pune."}
        </p>
      </header>

      <nav aria-label="Categories" className="-mx-5 mt-8 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <ul className="flex gap-2 whitespace-nowrap">
          <li><Link href="/furniture" className={cn("inline-flex min-h-10 items-center rounded-full border px-4 text-sm", !category ? "border-bottle bg-bottle text-paper" : "border-line hover:border-ink")}>All</Link></li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/furniture/${c.slug}`} className={cn("inline-flex min-h-10 items-center rounded-full border px-4 text-sm", category?.id === c.id ? "border-bottle bg-bottle text-paper" : "border-line hover:border-ink")} aria-current={category?.id === c.id ? "page" : undefined}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <Suspense fallback={null}>
          <FilterSidebar materials={materials} bounds={bounds} />
        </Suspense>
        <div>
          <Suspense fallback={<div className="skeleton h-11 w-full" />}>
            <Toolbar materials={materials} bounds={bounds} total={total} />
          </Suspense>
          <div className="mt-8">
            {items.length ? (
              <ProductGrid items={items} />
            ) : (
              <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center">
                <h2 className="text-2xl">No pieces match these filters</h2>
                <p className="mt-2 text-muted">Try removing a filter, or tell us what you&apos;re looking for and we&apos;ll help you find it.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href={basePath} className="btn-primary">Clear filters</Link>
                  <Link href="/contact" className="btn-outline">Ask our team</Link>
                </div>
              </div>
            )}
          </div>
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={pageHref(n)} aria-current={n === page ? "page" : undefined} className={cn("inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm", n === page ? "bg-bottle text-paper" : "hover:bg-ink/5")}>
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="container-x pt-8 lg:pt-12" aria-busy="true">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-6 h-12 w-72" />
      <div className="skeleton mt-4 h-5 w-full max-w-lg" />
      <div className="mt-8 flex gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 w-24 rounded-full" />)}</div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-3 lg:block">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-5 w-full" />)}</div>
        <div>
          <div className="skeleton h-11 w-full" />
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}><div className="skeleton aspect-[4/5]" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-4 w-1/3" /></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
