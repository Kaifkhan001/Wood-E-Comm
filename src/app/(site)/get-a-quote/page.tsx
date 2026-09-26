import { QuoteForm } from "@/components/forms/quote-form";
import { pageMeta } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

export const metadata = pageMeta({
  title: "Get a free interior design quote",
  description: "Tell us about your flat or home in three quick steps. A designer will call you within one working day with ideas and a budget estimate.",
  path: "/get-a-quote",
});

export default function QuotePage() {
  return (
    <div className="container-x grid gap-12 pt-10 lg:grid-cols-[1fr_1.5fr] lg:pt-14">
      <div>
        <h1 className="text-[42px] leading-[1.04] sm:text-[56px]">Get a free quote for your home</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
          Three quick steps. A designer will call you within one working day with ideas and a realistic budget. No site visit charges in Mumbai, Thane and Navi Mumbai.
        </p>
        <div className="mt-8 space-y-3 text-[15px]">
          <p>Prefer to talk now?</p>
          <a href={whatsappLink("Hi Wood & Wonders, I need a quote for interior design work.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#1f7a4d] underline-offset-4 hover:underline">
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp a designer
          </a>
          <p><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">{site.phone}</a>, {site.hours}</p>
        </div>
      </div>
      <QuoteForm />
    </div>
  );
}
