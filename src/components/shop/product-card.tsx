import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { imageSrc } from "@/lib/images";
import { discountPercent, formatINR } from "@/lib/utils";
import type { ProductCardData } from "@/lib/queries/catalog";

export function ProductCard({ p, priority }: { p: ProductCardData; priority?: boolean }) {
  const [a, b] = p.images;
  const off = discountPercent(p.price, p.mrp);
  return (
    <article className="group relative">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-cane/30">
          {a && (
            <SmartImage
              src={imageSrc(a, 800)}
              alt={a.alt || p.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
            />
          )}
          {b && (
            <SmartImage
              src={imageSrc(b, 800)}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 33vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
            />
          )}
          {p.stock === 0 && <span className="absolute left-3 top-3 rounded-full bg-paper px-2.5 py-1 text-xs font-medium">Out of stock</span>}
          {p.stock > 0 && off >= 10 && <span className="absolute left-3 top-3 rounded-full bg-brass px-2.5 py-1 text-xs font-medium text-white">{off}% off</span>}
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="font-sans text-[15px] font-medium leading-snug text-ink group-hover:text-bottle">{p.name}</h3>
          <p className="text-sm text-muted">{p.material}</p>
          <p className="flex items-baseline gap-2 pt-0.5">
            <span className="font-semibold tabular-nums">{formatINR(p.price)}</span>
            {off > 0 && <s className="text-sm text-muted tabular-nums">{formatINR(p.mrp!)}</s>}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {items.map((p, i) => (
        <li key={p.id}>
          <ProductCard p={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="skeleton aspect-[4/5]" />
          <div className="skeleton mt-3 h-4 w-3/4" />
          <div className="skeleton mt-2 h-3.5 w-1/3" />
          <div className="skeleton mt-2 h-4 w-1/4" />
        </li>
      ))}
    </ul>
  );
}
