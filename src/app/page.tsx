import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getCategories, getFeaturedProducts, getProjects } from "@/lib/queries/catalog";
import { ProductGrid } from "@/components/shop/product-card";
import { ProjectsRail } from "@/components/home/projects-rail";
import { HeroSlideshow } from "@/components/home/hero-slideshow";
import { SmartImage } from "@/components/ui/smart-image";
import { cloudinaryUrl, unsplash } from "@/lib/images";
import { site, whatsappLink } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icons";
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

  const heroSlides = projects.length
    ? projects.slice(0, 3).map((p) => ({ src: cloudinaryUrl(p.coverUrl, 1920, { fit: "cover" }), alt: p.title }))
    : [{ src: unsplash("photo-1586023492125-27b2c045efd7", 1920), alt: "A living room with a wooden sofa, cane chair and warm lighting" }];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate min-h-[88svh] overflow-hidden lg:min-h-[92svh] lg:max-h-[900px]">
        <HeroSlideshow slides={heroSlides} />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/80 via-ink/45 to-transparent lg:block" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-ink/90 via-ink/70 to-transparent lg:hidden" aria-hidden />

        <div className="container-x absolute inset-0 z-10 flex flex-col justify-end pb-24 lg:justify-center lg:pb-0">
          <div className="max-w-[640px]">
            <p className="text-sm font-medium text-paper sm:text-base">Furniture and interiors, Mumbai</p>
            <h1 className="mt-3 text-[38px] leading-[1.04] text-paper min-[380px]:text-[44px] sm:text-[56px] lg:text-[76px]">Timeless pieces, crafted in wood.</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/90">
              Solid-wood furniture from our own workshop, and complete interiors for new homes and renovations.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 min-[400px]:max-w-sm min-[400px]:grid-cols-2 lg:flex lg:max-w-none lg:flex-wrap">
              <Link href="/furniture" className="btn-light w-full lg:w-auto">Shop furniture</Link>
              <Link href="/get-a-quote" className="btn w-full border border-paper text-paper hover:bg-paper/10 lg:w-auto">Plan your interiors</Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden justify-center lg:flex">
          <ChevronDown className="h-6 w-6 animate-[hero-scroll-cue_2s_ease-in-out_infinite] text-paper/80 motion-reduce:animate-none" aria-hidden />
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
                {c.imageUrl && <SmartImage src={cloudinaryUrl(c.imageUrl, 600, { fit: "cover", ar: "4:3" })} alt="" fill sizes="(min-width:768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
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
            <a href={whatsappLink("Hi Wood & Wonders, I need a quote for interior design. I can share my floor plan.")} target="_blank" rel="noopener noreferrer" className="btn flex-1 bg-[#1f7a4d] text-white hover:bg-[#19663f]">
              <WhatsAppIcon className="h-5 w-5" /> Send on WhatsApp
            </a>
            <a href={`mailto:${site.email}?subject=${encodeURIComponent("Interior design enquiry")}`} className="btn-outline flex-1">Email us</a>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 sm:flex-row sm:items-center">
          <p className="text-lg">Follow new pieces and project walkthroughs</p>
          <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-10 px-4"><InstagramIcon className="h-4 w-4" /> Instagram</a>
        </div>
      </section>
    </>
  );
}
