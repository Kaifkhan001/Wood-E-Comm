import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, Hammer, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/catalog";
import { imageSrc } from "@/lib/images";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { discountPercent, formatINR } from "@/lib/utils";
import { Gallery } from "@/components/shop/gallery";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ProductGrid } from "@/components/shop/product-card";
import { WhatsAppIcon } from "@/components/ui/icons";

export const revalidate = 300;

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
  if (!p) return { title: "Product not found" };
  return pageMeta({
    title: `${p.name}, ${p.material}`,
    description: `${p.shortDescription} ${formatINR(p.price)}. Free delivery and installation in Mumbai.`.slice(0, 160),
    path: `/product/${p.slug}`,
    image: p.images[0] ? imageSrc(p.images[0], 1200) : undefined,
  });
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const related = await getRelatedProducts(p.categoryId, p.id);
  const off = discountPercent(p.price, p.mrp);
  const images = p.images.map((img) => ({ src: imageSrc(img, 1400), alt: img.alt }));
  const url = `${site.url}/product/${p.slug}`;

  return (
    <div className="container-x pt-8 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.shortDescription,
          image: images.map((i) => i.src),
          sku: p.id,
          material: p.material,
          color: p.color,
          category: p.category.name,
          brand: { "@type": "Brand", name: site.name },
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
          { name: p.name, path: `/product/${p.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
          <li><Link href="/furniture" className="hover:text-ink">Furniture</Link> /</li>
          <li><Link href={`/furniture/${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link> /</li>
          <li aria-current="page" className="text-ink">{p.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Gallery images={images} name={p.name} />

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

          <dl className="mt-10 divide-y divide-line border-y border-line text-[15px]">
            {[
              ["Material", p.material],
              ["Finish", p.color],
              ["Dimensions", p.dimensions],
              ["Category", p.category.name],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>

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
            <h2 id="related" className="text-3xl">More {p.category.name.toLowerCase()}</h2>
            <Link href={`/furniture/${p.category.slug}`} className="text-[15px] underline underline-offset-4 hover:text-bottle">See all</Link>
          </div>
          <ProductGrid items={related} />
        </section>
      )}
    </div>
  );
}
