import Link from "next/link";
import { getProjects } from "@/lib/queries/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { pageMeta, JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;
export const metadata = pageMeta({
  title: "Interior design for flats and homes in Mumbai",
  description: "End-to-end interior design for 1, 2, 3 and 4 BHK flats, villas and offices. See completed projects and get a free quote.",
  path: "/interior-design",
});

export default async function InteriorsPage() {
  const projects = await getProjects();
  return (
    <div className="container-x pt-10 lg:pt-14">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Interior design", path: "/interior-design" }])} />
      <header className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <h1 className="text-[44px] leading-[1.02] sm:text-[64px]">Interiors designed around how you actually live.</h1>
        <div>
          <p className="text-lg leading-relaxed text-muted">
            Modular kitchens, wardrobes, false ceilings, lighting and furniture, designed and built by one team, on one timeline, for one quoted price.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/get-a-quote" className="btn-primary">Get a free quote</Link>
            <Link href="/contact" className="btn-outline">Visit the studio</Link>
          </div>
        </div>
      </header>

      <ul className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2">
        {projects.map((p, i) => (
          <li key={p.id} className={i % 3 === 0 ? "sm:col-span-2" : ""}>
            <Link href={`/interior-design/${p.slug}`} className="group block">
              <div className={`relative overflow-hidden rounded-sm bg-cane/30 ${i % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                <SmartImage src={p.coverUrl} alt={p.title} fill priority={i === 0} sizes={i % 3 === 0 ? "100vw" : "(min-width:640px) 50vw, 100vw"} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl leading-tight group-hover:text-bottle sm:text-[28px]">{p.title}</h2>
                <p className="text-sm text-muted">{p.homeType}, {p.style}{p.areaSqft ? `, ${p.areaSqft} sq ft` : ""}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
