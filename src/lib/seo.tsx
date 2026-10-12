import type { Metadata } from "next";
import { site } from "./site";

export function pageMeta({
  title,
  description,
  path,
  image,
  noindex,
  noindexFollow,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Excludes the page from the index entirely and doesn't crawl its links
   * (private/account pages, stale redirect stubs). */
  noindex?: boolean;
  /** Excludes the page from the index but still crawls its links -- for
   * filtered listing URLs with too many combinations to be worth indexing
   * individually, where the canonical already points crawlers at the
   * unfiltered page. */
  noindexFollow?: boolean;
}): Metadata {
  const url = `${site.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 800 }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
    ...(noindex ? { robots: { index: false, follow: false } } : noindexFollow ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["FurnitureStore", "HomeAndConstructionBusiness"],
    name: site.name,
    url: site.url,
    email: site.email,
    telephone: `+${site.whatsapp}`,
    description: site.description,
    image: `${site.url}/brand/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    areaServed: "IN",
    sameAs: [site.socials.instagram],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

/** Serialises JSON-LD safely (prevents </script> injection from DB content). */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
