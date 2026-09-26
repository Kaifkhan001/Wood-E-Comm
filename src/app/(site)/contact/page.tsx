import { ContactForm } from "@/components/forms/contact-form";
import { pageMeta } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon, InstagramIcon, FacebookIcon, YouTubeIcon } from "@/components/ui/icons";
import { Mail, Phone, MapPin } from "lucide-react";

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
            <a href={whatsappLink("Hi Aangan, I have a question.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-bottle">
              <WhatsAppIcon className="h-5 w-5 text-[#1f7a4d]" /> Chat on WhatsApp
            </a>
          </li>
          <li><a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:text-bottle"><Mail className="h-5 w-5 text-bottle" strokeWidth={1.6} /> {site.email}</a></li>
          <li><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-bottle"><Phone className="h-5 w-5 text-bottle" strokeWidth={1.6} /> {site.phone}</a></li>
          <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-bottle" strokeWidth={1.6} /> <span>{site.address.street}, {site.address.city} {site.address.postalCode}<br /><span className="text-muted">{site.hours}</span></span></li>
        </ul>
        <div className="mt-8 flex gap-1 text-muted">
          <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full p-2.5 hover:bg-ink/5 hover:text-ink"><InstagramIcon className="h-5 w-5" /></a>
          <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full p-2.5 hover:bg-ink/5 hover:text-ink"><FacebookIcon className="h-5 w-5" /></a>
          <a href={site.socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-full p-2.5 hover:bg-ink/5 hover:text-ink"><YouTubeIcon className="h-5 w-5" /></a>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-paper p-6 sm:p-9">
        <h2 className="text-2xl">Send us a message</h2>
        <div className="mt-6"><ContactForm /></div>
      </div>
    </div>
  );
}
