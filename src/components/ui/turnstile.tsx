"use client";
import Script from "next/script";
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

/** Invisible-ish Cloudflare bot check. Renders nothing when not configured. */
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);
  const key = useId();

  useEffect(() => {
    if (!siteKey) return;
    const tryRender = () => {
      if (!ref.current || !window.turnstile || idRef.current) return false;
      idRef.current = window.turnstile.render(ref.current, { sitekey: siteKey, size: "flexible", appearance: "interaction-only", callback: onToken });
      return true;
    };
    if (tryRender()) return;
    const t = setInterval(() => tryRender() && clearInterval(t), 300);
    return () => {
      clearInterval(t);
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current);
      idRef.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={ref} key={key} />
    </>
  );
}

/** Hidden honeypot field. Real people never see or fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" name="website" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
