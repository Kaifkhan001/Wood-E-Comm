"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Honeypot, Turnstile } from "@/components/ui/turnstile";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";
import { submitLead } from "@/app/actions/public";
import { unsplash } from "@/lib/images";

const KEY = "aangan_offer_v1";
const SNOOZE_DAYS = 14;
const DELAY_MS = 20_000;
const EXCLUDED = ["/admin", "/checkout", "/cart", "/login", "/signup", "/account", "/thank-you", "/privacy-policy", "/terms"];

/**
 * "Unlock your discount" offer. Deliberately NOT shown on entry: it waits for
 * 20 seconds or half a page of scrolling, only after the cookie choice, once per
 * 14 days. Google penalises intrusive interstitials, especially on mobile.
 */
export function DiscountPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [token, setToken] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const excluded = EXCLUDED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (excluded) return;
    try {
      const until = Number(localStorage.getItem(KEY) || 0);
      if (until > Date.now()) return;
    } catch {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      if (readConsent() === null) return; // wait for cookie decision
      const trigger = () => {
        setOpen(true);
        cleanup();
      };
      const onScroll = () => {
        const h = document.documentElement;
        if (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) > 0.5) trigger();
      };
      const cleanup = () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", onScroll);
      };
      timer = setTimeout(trigger, DELAY_MS);
      window.addEventListener("scroll", onScroll, { passive: true });
      return cleanup;
    };
    let cleanup = arm();
    const onConsent = () => {
      cleanup?.();
      cleanup = arm();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => {
      cleanup?.();
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, [excluded]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 250);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit mobile number.");
    if (!consent) return setError("Please accept the terms to continue.");
    setState("sending");
    const res = await submitLead({ phone, consent, website: hp, turnstileToken: token });
    if (res.ok) {
      setState("done");
      try {
        localStorage.setItem(KEY, String(Date.now() + 365 * 86_400_000));
      } catch {}
    } else {
      setState("idle");
      setError(res.error);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/45" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-title"
            className="relative grid w-full max-w-3xl overflow-hidden rounded-t-2xl bg-paper sm:rounded-xl md:grid-cols-[1fr_1.1fr]"
            initial={{ y: 60, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" onClick={close} aria-label="Close offer" className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper/80 hover:bg-paper">
              <X className="h-5 w-5" />
            </button>

            <div className="relative hidden bg-bottle md:block">
              <SmartImage src={unsplash("photo-1567538096630-e0c55bd6374c", 900)} alt="" fill sizes="360px" className="object-cover opacity-80" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bottle via-bottle/70 to-transparent p-7 pt-24 text-paper">
                <p className="font-display text-[56px] leading-[0.9]">5% off</p>
                <p className="mt-2 text-paper/85">your first furniture order</p>
              </div>
            </div>

            <div className="p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] sm:p-9">
              {state === "done" ? (
                <div className="py-6">
                  <h2 id="offer-title" className="text-3xl">You&apos;re in.</h2>
                  <p className="mt-3 leading-relaxed text-muted">
                    Your 5% welcome offer is saved against your number. We&apos;ll apply it when our team confirms your first order.
                  </p>
                  <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-6">Keep browsing</button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="relative">
                  <p className="font-display text-2xl text-bottle md:hidden">5% off your first order</p>
                  <h2 id="offer-title" className="mt-1 text-[28px] leading-tight md:mt-0">Unlock your discount</h2>
                  <p className="mt-2 text-muted">Leave your mobile number and get 5% off your first furniture order.</p>
                  <label htmlFor="offer-phone" className="label-text mt-6">Mobile number</label>
                  <div className="flex overflow-hidden rounded-md border border-line bg-white focus-within:border-bottle">
                    <span className="flex items-center border-r border-line px-3 text-muted">+91</span>
                    <input
                      ref={inputRef}
                      id="offer-phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98xxxxxxxx"
                      className="w-full bg-transparent px-3 py-3 text-[16px] outline-none"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "offer-error" : undefined}
                    />
                  </div>
                  <label className="mt-4 flex items-start gap-2.5 text-sm leading-snug text-muted">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-bottle" />
                    <span>
                      I agree to be contacted about this offer and accept the{" "}
                      <Link href="/terms" className="underline underline-offset-2">terms</Link> and{" "}
                      <Link href="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
                    </span>
                  </label>
                  <Honeypot value={hp} onChange={setHp} />
                  <Turnstile onToken={setToken} />
                  {error && <p id="offer-error" role="alert" className="field-error">{error}</p>}
                  <button type="submit" disabled={state === "sending" || phone.length !== 10 || !consent} className="btn-primary mt-5 w-full">
                    {state === "sending" ? "Saving…" : "Unlock 5% off"}
                  </button>
                  <button type="button" onClick={close} className="mt-3 w-full py-2 text-sm text-muted underline-offset-4 hover:underline">No thanks</button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
