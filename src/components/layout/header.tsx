"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Search, User, X } from "lucide-react";
import { nav, site, whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CartButton } from "@/components/cart/cart-button";
import { useSession } from "@/lib/auth-client";
import { InstagramIcon, FacebookIcon, YouTubeIcon, WhatsAppIcon } from "@/components/ui/icons";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color] duration-300",
        scrolled ? "border-b border-line bg-plaster/90 backdrop-blur-md" : "border-b border-transparent bg-plaster",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link href="/" className="shrink-0 font-display text-lg leading-none tracking-tight text-sheesham sm:text-2xl lg:text-[26px]" aria-label={`${site.name} home`}>
          Wood &amp; Wonders
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative py-2 text-[15px] transition-colors hover:text-bottle",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-bottle after:transition-transform after:duration-300",
                      active ? "text-bottle after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-0.5">
          <Link href="/furniture?focus=search" className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5 sm:inline-flex" aria-label="Search furniture">
            <Search className="h-5 w-5" strokeWidth={1.6} />
          </Link>
          <Link
            href={session ? ((session.user as { role?: string }).role === "admin" ? "/admin" : "/account") : "/login"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5"
            aria-label={session ? "Your account" : "Sign in"}
          >
            <User className="h-5 w-5" strokeWidth={1.6} />
          </Link>
          <CartButton />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5 lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,380px)] flex-col bg-paper lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-16 items-center justify-between px-5">
                <span className="font-display text-xl text-sheesham">Wood &amp; Wonders</span>
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-4">
                <ul>
                  {[{ href: "/", label: "Home" }, ...nav, { href: "/account", label: "Your account" }].map((item, i) => (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.05, duration: 0.3 }}
                      className="border-b border-line"
                    >
                      <Link href={item.href} className="block py-4 font-display text-[28px] leading-tight text-ink">
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <div className="space-y-4 border-t border-line p-5">
                <a href={whatsappLink("Hi Wood & Wonders, I'd like to know more about your furniture and interiors.")} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                  <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
                </a>
                <div className="flex justify-center gap-2 text-muted">
                  <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2.5 hover:text-bottle"><InstagramIcon className="h-5 w-5" /></a>
                  <a href={site.socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2.5 hover:text-bottle"><FacebookIcon className="h-5 w-5" /></a>
                  <a href={site.socials.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2.5 hover:text-bottle"><YouTubeIcon className="h-5 w-5" /></a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
