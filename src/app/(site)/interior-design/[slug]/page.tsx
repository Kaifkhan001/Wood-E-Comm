import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getProjects } from "@/lib/queries/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { breadcrumbJsonLd, JsonLd, pageMeta } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return (await getProjects()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/interior-design/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "Project not found" };
  return pageMeta({ title: `${p.title}: ${p.homeType} interior design`, description: p.summary.slice(0, 158), path: `/interior-design/${p.slug}`, image: p.coverUrl });
}

export default async function ProjectPage({ params }: PageProps<"/interior-design/[slug]">) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) notFound();
  const facts = [
    ["Home", p.homeType],
    ["Location", p.location],
    ["Style", p.style],
    ["Area", p.areaSqft ? `${p.areaSqft} sq ft` : null],
    ["Timeline", p.durationWeeks ? `${p.durationWeeks} weeks` : null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <article className="container-x pt-8 lg:pt-12">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Interior design", path: "/interior-design" }, { name: p.title, path: `/interior-design/${p.slug}` }])} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/interior-design" className="hover:text-ink">Interior design</Link> / <span className="text-ink" aria-current="page">{p.title}</span>
      </nav>
      <h1 className="mt-5 max-w-4xl text-[40px] leading-[1.04] sm:text-[60px]">{p.title}</h1>
      <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-sm bg-cane/30">
        <SmartImage src={p.coverUrl} alt={p.title} fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <dl className="h-fit divide-y divide-line border-y border-line">
          {facts.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] py-3 text-[15px]"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <div>
          <p className="text-xl leading-relaxed">{p.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/get-a-quote" className="btn-primary">Get a quote for your home</Link>
            <a href={whatsappLink(`Hi Aangan, I saw the "${p.title}" project and need a quote for interior design.`)} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <WhatsAppIcon className="h-5 w-5" /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
      {p.gallery.length > 1 && (
        <ul className="mt-16 grid gap-4 sm:grid-cols-2">
          {p.gallery.slice(1).map((src, i) => (
            <li key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-sm bg-cane/30">
              <SmartImage src={src} alt={`${p.title}, view ${i + 2}`} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
