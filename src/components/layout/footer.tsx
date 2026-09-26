import Link from "next/link";
import { site } from "@/lib/site";
import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/ui/icons";

const cols = [
  {
    title: "Furniture",
    links: [
      { href: "/furniture/sofas", label: "Sofas" },
      { href: "/furniture/beds", label: "Beds" },
      { href: "/furniture/dining", label: "Dining" },
      { href: "/furniture/storage", label: "Storage" },
      { href: "/furniture", label: "All furniture" },
    ],
  },
  {
    title: "Interiors",
    links: [
      { href: "/interior-design", label: "Our projects" },
      { href: "/get-a-quote", label: "Get a quote" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/account", label: "Your orders" },
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms", label: "Terms and conditions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-sheesham pb-28 text-paper/80 lg:pb-0">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <p className="font-display text-3xl text-paper sm:text-4xl">Wood &amp; Wonders</p>
          <p className="mt-4 leading-relaxed">{site.description}</p>
          <address className="mt-6 not-italic leading-relaxed">
            {site.address.street}, {site.address.city} {site.address.postalCode}
            <br />
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-paper">{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`} className="hover:text-paper">{site.email}</a>
          </address>
          <div className="mt-6 flex gap-1">
            <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full p-2.5 hover:bg-paper/10 hover:text-paper"><InstagramIcon className="h-5 w-5" /></a>
            <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full p-2.5 hover:bg-paper/10 hover:text-paper"><FacebookIcon className="h-5 w-5" /></a>
            <a href={site.socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-full p-2.5 hover:bg-paper/10 hover:text-paper"><YouTubeIcon className="h-5 w-5" /></a>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="font-sans text-sm font-semibold text-paper">{c.title}</h2>
            <ul className="mt-4 space-y-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-paper">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/15">
        <div className="container-x flex flex-col gap-2 py-6 text-sm sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>{site.hours}</p>
        </div>
      </div>
    </footer>
  );
}
