import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { mapsLink, site } from "@/lib/site";
import { InstagramIcon } from "@/components/ui/icons";

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
          <div className="inline-block rounded-xl bg-paper p-3">
            <Image src="/brand/logo-on-white.png" alt="Wood & Wonders" width={600} height={428} className="h-16 w-auto sm:h-20" />
          </div>
          <p className="mt-4 leading-relaxed">{site.description}</p>
          <address className="mt-6 not-italic leading-relaxed [overflow-wrap:anywhere]">
            {site.addressLines.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
            <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-paper underline underline-offset-4 hover:no-underline">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} /> Get directions
            </a>
            <br />
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-paper">{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`} className="break-words hover:text-paper">{site.email}</a>
          </address>
          <div className="mt-6">
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-paper lg:hidden"
            >
              <InstagramIcon className="h-5 w-5" /> Follow us on Instagram
            </a>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="rounded-lg bg-paper p-2">
                <Image src="/brand/instagram-qr.svg" alt="QR code to the Wood & Wonders Instagram profile" width={120} height={120} className="h-[120px] w-[120px]" unoptimized />
              </div>
              <div>
                <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-paper">
                  <InstagramIcon className="h-4 w-4" /> {site.socials.instagramHandle}
                </a>
                <p className="mt-1 text-sm">Scan to follow us<br />on Instagram</p>
              </div>
            </div>
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
