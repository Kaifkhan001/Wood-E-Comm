import Link from "next/link";
import { getCategories, getFeaturedProducts, getProjects } from "@/lib/queries/catalog";
import { ProductGrid } from "@/components/shop/product-card";
import { ProjectsRail } from "@/components/home/projects-rail";
import { SmartImage } from "@/components/ui/smart-image";
import { unsplash } from "@/lib/images";
import { site, whatsappLink } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/ui/icons";
import { pageMeta } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMeta({
  title: `${site.name}: solid-wood furniture and interior design in Mumbai`,
  description: site.description,
  path: "/",
});

const STEPS = [
  { t: "Talk to a designer", d: "A free 30-minute call or studio visit to understand your home, budget and how you live." },
  { t: "See the design", d: "3D views, material samples and a line-by-line quote. Nothing is built until you approve it." },
  { t: "We build it", d: "Our own carpenters and site team, with a weekly progress update on WhatsApp." },
  { t: "Move in", d: "Deep-cleaned, snag-checked and handed over on the agreed date, with a one-year warranty." },
];

export default async function HomePage() {
  const [cats, featured, projects] = await Promise.all([getCategories(), getFeaturedProducts(8), getProjects(6)]);

  return (
    <>
      {/* Hero */}
      <section className="container-x grid items-center gap-10 pb-16 pt-6 lg:grid-cols-[1fr_1.2fr] lg:gap-14 lg:pb-24 lg:pt-10">
        <div className="max-w-xl">
          <h1 className="text-[46px] leading-[1.02] sm:text-[64px] lg:text-[76px]">Made for homes that are lived in.</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Solid-wood furniture from our own workshop, and complete interior design for new flats and renovations in Mumbai.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/furniture" className="btn-primary">Shop furniture</Link>
            <Link href="/get-a-quote" className="btn-outline">Plan your interiors</Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            <div><dt className="text-sm text-muted">Homes designed</dt><dd className="mt-1 font-display text-3xl">140+</dd></div>
            <div><dt className="text-sm text-muted">Workshop</dt><dd className="mt-1 font-display text-3xl">Jodhpur</dd></div>
            <div><dt className="text-sm text-muted">Warranty</dt><dd className="mt-1 font-display text-3xl">1 year</dd></div>
          </dl>
        </div>
        <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-sm lg:aspect-[4/4.2]">
            <SmartImage src={unsplash("photo-1586023492125-27b2c045efd7", 1600)} alt="A living room with a wooden sofa, cane chair and warm lighting" fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 left-4 max-w-[260px] rounded-md bg-paper p-4 shadow-lg shadow-ink/10 sm:left-8">
            <p className="text-sm text-muted">Delivered last week</p>
            <p className="mt-1 font-medium">Kaveri sofa and Varli lounge chair, Andheri West</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-heading" className="container-x py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 id="cat-heading" className="text-[34px] leading-tight sm:text-[44px]">Shop by room</h2>
          <Link href="/furniture" className="text-[15px] underline underline-offset-4 hover:text-bottle">All furniture</Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/furniture/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-sm bg-cane/30">
                {c.imageUrl && <SmartImage src={c.imageUrl} alt="" fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-12 font-display text-2xl text-paper sm:text-3xl">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      <section aria-labelledby="featured-heading" className="container-x py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="text-[34px] leading-tight sm:text-[44px]">Most loved pieces</h2>
            <p className="mt-2 text-muted">What our customers order most, all in stock and ready to deliver.</p>
          </div>
          <Link href="/furniture?sort=featured" className="hidden text-[15px] underline underline-offset-4 hover:text-bottle sm:inline">Shop all</Link>
        </div>
        <div className="mt-10"><ProductGrid items={featured} /></div>
      </section>

      {/* Projects: pinned horizontal scroll */}
      {projects.length > 0 && (
        <div className="mt-8">
          <ProjectsRail items={projects.map((p) => ({ slug: p.slug, title: p.title, location: p.location, homeType: p.homeType, coverUrl: p.coverUrl }))} />
        </div>
      )}

      {/* Process — a real sequence, so it's numbered */}
      <section aria-labelledby="process-heading" className="container-x py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 id="process-heading" className="text-[34px] leading-tight sm:text-[44px]">How an interior project works</h2>
            <p className="mt-4 max-w-sm text-lg leading-relaxed text-muted">Most 2 BHK homes take 8 to 10 weeks from the first call to handover.</p>
            <Link href="/get-a-quote" className="btn-primary mt-8">Get a free quote</Link>
          </div>
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.t} className="border-t border-ink/20 pt-5">
                <span className="font-display text-4xl text-brass">{i + 1}</span>
                <h3 className="mt-3 font-sans text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contact band */}
      <section aria-labelledby="contact-heading" className="container-x">
        <div className="grid gap-8 rounded-lg bg-cane/45 p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 id="contact-heading" className="text-[32px] leading-tight sm:text-[40px]">Have a floor plan? Send it over.</h2>
            <p className="mt-3 max-w-lg text-lg text-ink/75">Share it on WhatsApp and a designer will reply with ideas and a rough budget, usually the same day.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a href={whatsappLink("Hi Aangan, I need a quote for interior design. I can share my floor plan.")} target="_blank" rel="noopener noreferrer" className="btn flex-1 bg-[#1f7a4d] text-white hover:bg-[#19663f]">
              <WhatsAppIcon className="h-5 w-5" /> Send on WhatsApp
            </a>
            <a href={`mailto:${site.email}?subject=${encodeURIComponent("Interior design enquiry")}`} className="btn-outline flex-1">Email us</a>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 sm:flex-row sm:items-center">
          <p className="text-lg">Follow new pieces and project walkthroughs</p>
          <div className="flex gap-3">
            <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-10 px-4"><InstagramIcon className="h-4 w-4" /> Instagram</a>
            <a href={site.socials.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-10 px-4"><YouTubeIcon className="h-4 w-4" /> YouTube</a>
          </div>
        </div>
      </section>
    </>
  );
}
