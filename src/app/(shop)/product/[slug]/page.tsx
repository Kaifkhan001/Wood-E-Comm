import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Truck, Hammer, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { productSlugRedirects, products } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/catalog";
import { imageSrc } from "@/lib/images";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { discountPercent, formatINR } from "@/lib/utils";
import { ASSEMBLY_OPTIONS, formatSpecValue, specFieldsFor, type SpecGroup } from "@/lib/catalog-options";
import { Gallery } from "@/components/shop/gallery";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductGrid } from "@/components/shop/product-card";
import { WhatsAppIcon } from "@/components/ui/icons";

type ProductRow = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

const SPEC_GROUP_ORDER: SpecGroup[] = ["Dimensions & weight", "Materials", "Features", "Warranty & care"];

/** Groups every filled spec -- the fixed product columns plus the category's
 * template fields from `specs` -- into the four sections shown on the page. */
function buildSpecGroups(p: ProductRow) {
  const groups: Record<SpecGroup, { label: string; value: string }[]> = {
    "Dimensions & weight": [],
    Materials: [],
    Features: [],
    "Warranty & care": [],
  };

  const dims = p.widthCm && p.depthCm && p.heightCm ? `W ${p.widthCm} × D ${p.depthCm} × H ${p.heightCm} cm` : p.dimensions || null;
  if (dims) groups["Dimensions & weight"].push({ label: "Product dimensions (W × D × H)", value: dims });
  if (p.weightKg) groups["Dimensions & weight"].push({ label: "Item weight", value: `${p.weightKg} kg` });
  if (p.material) groups.Materials.push({ label: "Material", value: p.material });
  if (p.color) groups.Materials.push({ label: "Colour / finish", value: p.color });
  groups.Features.push({ label: "Category", value: p.category.name });
  if (p.brand) groups["Warranty & care"].push({ label: "Brand", value: p.brand });
  if (p.sku) groups["Warranty & care"].push({ label: "SKU", value: p.sku });
  if (p.assembly) groups["Warranty & care"].push({ label: "Assembly", value: ASSEMBLY_OPTIONS.find((a) => a.value === p.assembly)?.label ?? p.assembly });
  if (p.warrantyMonths) groups["Warranty & care"].push({ label: "Warranty", value: `${p.warrantyMonths} months` });
  if (p.countryOfOrigin) groups["Warranty & care"].push({ label: "Country of origin", value: p.countryOfOrigin });

  for (const f of specFieldsFor(p.category.slug)) {
    const v = p.specs[f.key];
    if (v === undefined) continue;
    (groups[f.group ?? "Features"]).push({ label: f.label, value: formatSpecValue(f, v) });
  }

  return SPEC_GROUP_ORDER.map((group) => ({ group, rows: groups[group] })).filter((g) => g.rows.length > 0);
}

export const revalidate = 300;

/** Looks up a slug that moved (the product was renamed), so the old URL keeps
 * working via a real 308 instead of a 404. Resolves through the productId, so
 * it always lands on the CURRENT slug even after several renames. */
async function resolveProductRedirect(slug: string): Promise<string | null> {
  const [row] = await db.select({ productId: productSlugRedirects.productId }).from(productSlugRedirects).where(eq(productSlugRedirects.oldSlug, slug)).limit(1);
  if (!row) return null;
  const [p] = await db.select({ slug: products.slug }).from(products).where(and(eq(products.id, row.productId), eq(products.isActive, true))).limit(1);
  return p?.slug ?? null;
}

export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: products.slug }).from(products).where(eq(products.isActive, true));
    return rows.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) {
    const redirectSlug = await resolveProductRedirect(slug);
    if (redirectSlug) return pageMeta({ title: "Product moved", description: "", path: `/product/${redirectSlug}`, noindex: true });
    return { title: "Product not found" };
  }
  const descBase = p.shortDescription || p.highlights[0] || "";
  return pageMeta({
    title: `${p.name}, ${p.material}`,
    description: `${descBase} ${formatINR(p.price)}. Free delivery and installation in Mumbai.`.slice(0, 160),
    path: `/product/${p.slug}`,
    image: p.images[0] ? imageSrc(p.images[0], 1200) : undefined,
  });
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) {
    const redirectSlug = await resolveProductRedirect(slug);
    if (redirectSlug) permanentRedirect(`/product/${redirectSlug}`);
    notFound();
  }
  const related = await getRelatedProducts(p.categoryId, p.id, p.subcategoryId);
  const off = discountPercent(p.price, p.mrp);
  const jsonLdImages = p.images.map((img) => imageSrc(img, 1200, { fit: "cover", ar: "4:5" }));
  const url = `${site.url}/product/${p.slug}`;
  const specGroups = buildSpecGroups(p);

  const additionalProperty = specFieldsFor(p.category.slug)
    .map((f) => {
      const v = p.specs[f.key];
      return v === undefined ? null : { "@type": "PropertyValue", name: f.label, value: formatSpecValue(f, v) };
    })
    .filter((v): v is { "@type": "PropertyValue"; name: string; value: string } => v !== null);

  return (
    <div className="container-x pt-8 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.shortDescription,
          image: jsonLdImages,
          sku: p.sku || p.id,
          material: p.material,
          color: p.color || undefined,
          category: p.category.name,
          brand: { "@type": "Brand", name: p.brand || site.name },
          ...(p.widthCm ? { width: { "@type": "QuantitativeValue", value: p.widthCm, unitCode: "CMT" } } : {}),
          ...(p.depthCm ? { depth: { "@type": "QuantitativeValue", value: p.depthCm, unitCode: "CMT" } } : {}),
          ...(p.heightCm ? { height: { "@type": "QuantitativeValue", value: p.heightCm, unitCode: "CMT" } } : {}),
          ...(p.weightKg ? { weight: { "@type": "QuantitativeValue", value: p.weightKg, unitCode: "KGM" } } : {}),
          ...(additionalProperty.length ? { additionalProperty } : {}),
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "INR",
            price: p.price,
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: site.name },
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Furniture", path: "/furniture" },
          { name: p.category.name, path: `/furniture/${p.category.slug}` },
          ...(p.subcategory ? [{ name: p.subcategory.name, path: `/furniture/${p.category.slug}/${p.subcategory.slug}` }] : []),
          { name: p.name, path: `/product/${p.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
          <li><Link href="/furniture" className="hover:text-ink">Furniture</Link> /</li>
          <li><Link href={`/furniture/${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link> /</li>
          {p.subcategory && <li><Link href={`/furniture/${p.category.slug}/${p.subcategory.slug}`} className="hover:text-ink">{p.subcategory.name}</Link> /</li>}
          <li aria-current="page" className="text-ink">{p.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-24">
          <Gallery images={p.images} name={p.name} />
        </div>

        <div className="lg:pt-4">
          <p className="text-sm text-muted">{p.material}</p>
          <h1 className="mt-2 text-[36px] leading-[1.08] sm:text-[44px]">{p.name}</h1>
          <p className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums">{formatINR(p.price)}</span>
            {off > 0 && (
              <>
                <s className="text-muted tabular-nums">{formatINR(p.mrp!)}</s>
                <span className="rounded-full bg-brass/15 px-2.5 py-0.5 text-sm font-medium text-sheesham">{off}% off</span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">Inclusive of GST. You pay after our team confirms your order.</p>
          <p className="mt-6 text-[17px] leading-relaxed">{p.shortDescription}</p>

          {p.highlights.length > 0 && (
            <ul className="mt-5 space-y-2 text-[15px]">
              {p.highlights.map((h, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bottle" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <AddToCart productId={p.id} name={p.name} inStock={p.stock > 0} />
            {p.stock > 0 && p.stock <= 5 && <p className="mt-3 text-sm text-danger">Only {p.stock} left.</p>}
          </div>

          <a
            href={whatsappLink(`Hi Wood & Wonders, I'm interested in the ${p.name} (${formatINR(p.price)}). ${url}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-[15px] text-[#1f7a4d] underline-offset-4 hover:underline"
          >
            <WhatsAppIcon className="h-5 w-5" /> Ask about this piece on WhatsApp
          </a>

          {specGroups.length > 0 && (
            <div className="mt-10 space-y-6">
              <h2 className="text-xl font-semibold">Specifications</h2>
              {specGroups.map(({ group, rows }) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-muted">{group}</h3>
                  <dl className="mt-2 divide-y divide-line border-y border-line text-[15px]">
                    {rows.map((r) => (
                      <div key={r.label} className="grid grid-cols-[minmax(110px,40%)_minmax(0,1fr)] gap-4 py-2.5">
                        <dt className="text-muted">{r.label}</dt>
                        <dd className="min-w-0 break-words">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}

          <ul className="mt-8 space-y-4 text-[15px]">
            <li className="flex gap-3"><Truck className="mt-0.5 h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} /> Free delivery and installation in Mumbai, Thane and Pune</li>
            <li className="flex gap-3"><Hammer className="mt-0.5 h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} /> Made in our own workshop from seasoned wood</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} /> One-year warranty on joinery and hardware</li>
          </ul>
        </div>
      </div>

      {p.description && (
        <section className="mt-20 max-w-3xl" aria-labelledby="about-piece">
          <h2 id="about-piece" className="text-3xl">About this piece</h2>
          <div className="mt-5 space-y-4 text-[17px] leading-[1.7] text-ink/85">
            {p.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="related" className="text-3xl">More {p.subcategory ? p.subcategory.name.toLowerCase() : p.category.name.toLowerCase()}</h2>
            <Link
              href={p.subcategory ? `/furniture/${p.category.slug}/${p.subcategory.slug}` : `/furniture/${p.category.slug}`}
              className="text-[15px] underline underline-offset-4 hover:text-bottle"
            >
              See all
            </Link>
          </div>
          <ProductGrid items={related} />
        </section>
      )}
    </div>
  );
}
