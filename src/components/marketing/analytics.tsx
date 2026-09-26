"use client";
import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

/** Vercel Analytics is cookieless and always on. GA4 loads only after consent. */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent() === "all");
    const on = (e: Event) => setAllowed((e as CustomEvent).detail === "all");
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);

  return (
    <>
      <VercelAnalytics />
      {gaId && allowed ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  );
}
