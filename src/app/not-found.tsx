import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70vh] items-center gap-10 py-20 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="font-display text-[120px] leading-none text-cane sm:text-[180px]" aria-hidden="true">404</p>
        <h1 className="mt-2 text-[40px] leading-tight sm:text-[52px]">This room is empty.</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          The page you&apos;re looking for has moved or no longer exists. The furniture is still where you left it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/furniture" className="btn-primary">Browse furniture</Link>
          <Link href="/" className="btn-outline">Go to homepage</Link>
        </div>
      </div>
      <svg viewBox="0 0 400 300" className="hidden w-full max-w-md text-sheesham/25 lg:block" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M40 260h320M60 260V60h280v200" />
        <path d="M150 260v-90h100v90" />
        <rect x="90" y="100" width="60" height="50" />
        <rect x="250" y="100" width="60" height="50" />
      </svg>
    </div>
  );
}
