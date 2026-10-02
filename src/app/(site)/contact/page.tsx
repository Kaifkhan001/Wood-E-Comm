import Image from "next/image";
import { ContactForm } from "@/components/forms/contact-form";
import { pageMeta } from "@/lib/seo";
import { mapsLink, site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/icons";
import { Mail, Phone, MapPin, Navigation } from "lucide-react";

export const metadata = pageMeta({
  title: "Contact us",
  description: `Reach ${site.name} on WhatsApp, email or phone, or visit our studio in Mumbai. We reply within one working day.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container-x grid gap-14 pt-10 lg:grid-cols-[1fr_1.4fr] lg:pt-14">
      <div>
        <h1 className="text-[42px] leading-[1.04] sm:text-[56px]">Talk to us</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">WhatsApp is the fastest way to reach us. We reply to every message within one working day.</p>
        <ul className="mt-8 space-y-5 text-[15px]">
          <li>
            <a href={whatsappLink("Hi Wood & Wonders, I have a question.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-bottle">
              <WhatsAppIcon className="h-5 w-5 text-[#1f7a4d]" /> Chat on WhatsApp
            </a>
          </li>
          <li><a href={`mailto:${site.email}`} className="flex items-center gap-3 break-words hover:text-bottle"><Mail className="h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} /> {site.email}</a></li>
          <li><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-bottle"><Phone className="h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} /> {site.phone}</a></li>
          <li className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} />
            <span className="[overflow-wrap:anywhere]">
              {site.addressLines.map((line) => (
                <span key={line} className="block">{line}</span>
              ))}
              <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-bottle underline underline-offset-4 hover:no-underline">
                <Navigation className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} /> Get directions
              </a>
              <span className="mt-1 block text-muted">{site.hours}</span>
            </span>
          </li>
        </ul>
        <div className="mt-8">
          <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted hover:text-ink lg:hidden">
            <InstagramIcon className="h-5 w-5" /> Follow us on Instagram
          </a>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="rounded-lg border border-line bg-white p-2">
              <Image src="/brand/instagram-qr.svg" alt="QR code to the Wood & Wonders Instagram profile" width={120} height={120} className="h-[120px] w-[120px]" unoptimized />
            </div>
            <div>
              <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-ink hover:text-bottle">
                <InstagramIcon className="h-4 w-4" /> {site.socials.instagramHandle}
              </a>
              <p className="mt-1 text-sm text-muted">Scan to follow us<br />on Instagram</p>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-paper p-6 sm:p-9">
        <h2 className="text-2xl">Send us a message</h2>
        <div className="mt-6"><ContactForm /></div>
      </div>
    </div>
  );
}
