"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { SmartImage } from "@/components/ui/smart-image";
import { cloudinaryUrl } from "@/lib/images";

type Item = { slug: string; title: string; location: string; homeType: string; coverUrl: string };

/**
 * The page's one orchestrated moment: on desktop, vertical scrolling slides the
 * project cards sideways while the section stays pinned. On touch screens it's
 * a native swipe carousel with snap points.
 */
export function ProjectsRail({ items }: { items: Item[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${Math.max(0, (items.length - 2.2) / items.length) * 100}%`]);

  const Card = ({ p, i }: { p: Item; i: number }) => (
    <Link href={`/interior-design/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm lg:aspect-[5/6]">
        <SmartImage src={cloudinaryUrl(p.coverUrl, 900, { fit: "cover" })} alt={p.title} fill sizes="(min-width:1024px) 40vw, 80vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" priority={i < 2} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 to-transparent p-6 pt-20 text-paper">
          <p className="text-sm text-paper/80">{p.homeType}, {p.location}</p>
          <h3 className="mt-1 text-2xl leading-tight lg:text-[28px]">{p.title}</h3>
        </div>
      </div>
    </Link>
  );

  return (
    <section ref={ref} aria-labelledby="projects-heading" className="relative bg-bottle text-paper lg:h-[260vh]">
      <div className="py-16 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-center lg:overflow-hidden lg:py-0">
        <div className="container-x flex items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 id="projects-heading" className="text-[40px] leading-[1.05] sm:text-[52px]">Homes we&apos;ve finished recently</h2>
            <p className="mt-3 text-lg text-paper/75">Real projects, photographed on handover day.</p>
          </div>
          <Link href="/interior-design" className="btn-light hidden shrink-0 sm:inline-flex">See all projects</Link>
        </div>

        {/* Desktop: scroll-linked */}
        <div className="mt-10 hidden lg:block">
          <motion.ul style={reduce ? undefined : { x }} className="flex gap-6 pl-[max(2rem,calc((100vw-1320px)/2+2rem))] pr-8">
            {items.map((p, i) => (
              <li key={p.slug} className="w-[38vw] max-w-[560px] shrink-0"><Card p={p} i={i} /></li>
            ))}
          </motion.ul>
        </div>

        {/* Mobile/tablet: swipe */}
        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:px-8 lg:hidden">
          {items.map((p, i) => (
            <li key={p.slug} className="w-[80vw] max-w-[420px] shrink-0 snap-start"><Card p={p} i={i} /></li>
          ))}
        </ul>
        <div className="container-x mt-8 sm:hidden">
          <Link href="/interior-design" className="btn-light w-full">See all projects</Link>
        </div>
      </div>
    </section>
  );
}
