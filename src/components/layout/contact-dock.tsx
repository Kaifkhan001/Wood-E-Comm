"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

const HIDE_ON = ["/admin", "/checkout", "/login", "/signup"];

/** Desktop: floating WhatsApp button. Mobile: sticky bottom bar with the two main actions. */
export function ContactDock() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;
  const isInterior = pathname.startsWith("/interior-design") || pathname.startsWith("/get-a-quote");
  const msg = isInterior
    ? "Hi Wood & Wonders, I need a quote for interior design work."
    : "Hi Wood & Wonders, I have a question about your furniture.";

  return (
    <>
      <a
        href={whatsappLink(msg)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-lg shadow-ink/20 transition-transform duration-200 hover:scale-105 lg:flex"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 backdrop-blur lg:hidden">
        <div className="flex gap-2.5">
          <a href={whatsappLink(msg)} target="_blank" rel="noopener noreferrer" className="btn flex-1 border border-[#1f7a4d]/40 text-[#1f7a4d]">
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp
          </a>
          <Link href="/get-a-quote" className="btn-primary flex-1">
            <span className="hidden min-[380px]:inline">Get a free quote</span>
            <span className="min-[380px]:hidden">Free quote</span>
          </Link>
        </div>
      </div>
    </>
  );
}
