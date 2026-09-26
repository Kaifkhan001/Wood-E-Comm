import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";

export const metadata = pageMeta({ title: "Thank you", description: "We've received your request.", path: "/thank-you", noindex: true });

const COPY = {
  quote: { h: "We've got your details.", p: "A designer will call you within one working day. If you have a floor plan, send it on WhatsApp so we can come prepared." },
  contact: { h: "Message received.", p: "We'll reply within one working day, usually much sooner." },
  order: { h: "Your order request is in.", p: "Our team will call you to confirm availability, delivery date and payment. You can follow its status in your account." },
} as const;

export default async function ThankYou({ searchParams }: PageProps<"/thank-you">) {
  const sp = await searchParams;
  const type = (typeof sp.type === "string" && sp.type in COPY ? sp.type : "contact") as keyof typeof COPY;
  const order = typeof sp.order === "string" && /^WW-\d{5,}$/.test(sp.order) ? sp.order : null;
  const c = COPY[type];
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <h1 className="max-w-2xl text-[44px] leading-[1.04] sm:text-[60px]">{c.h}</h1>
      {order && <p className="mt-4 text-lg">Order number <strong className="tabular-nums">{order}</strong></p>}
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{c.p}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {type === "order" ? <Link href="/account" className="btn-primary">View your orders</Link> : <Link href="/furniture" className="btn-primary">Browse furniture</Link>}
        <a href={whatsappLink(order ? `Hi Wood & Wonders, about my order ${order}` : "Hi Wood & Wonders, following up on my request.")} target="_blank" rel="noopener noreferrer" className="btn-outline">Message us on WhatsApp</a>
      </div>
    </div>
  );
}
