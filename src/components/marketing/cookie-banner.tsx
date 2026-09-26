"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { readConsent, writeConsent } from "@/lib/consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(readConsent() === null), []);

  const choose = (v: "all" | "essential") => {
    writeConsent(v);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Cookie preferences"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-[84px] z-50 mx-auto max-w-xl rounded-lg border border-line bg-paper p-5 shadow-xl shadow-ink/10 lg:bottom-6 lg:left-6 lg:right-auto"
        >
          <p className="text-[15px] leading-relaxed">
            We use essential cookies to keep you signed in and remember your cart. With your permission we also use analytics
            cookies to see which pages are useful. Read our <Link href="/privacy-policy" className="underline underline-offset-4">privacy policy</Link>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => choose("all")}>Accept all</button>
            <button type="button" className="btn-outline" onClick={() => choose("essential")}>Essential only</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
