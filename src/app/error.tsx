"use client";
import Link from "next/link";
import { useEffect } from "react";

// Friendly message only; error details and stack traces are never shown to visitors.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <h1 className="text-[40px] leading-tight sm:text-[52px]">Something didn&apos;t load.</h1>
      <p className="mt-4 max-w-md text-lg text-muted">Try again. If it keeps happening, message us on WhatsApp and we&apos;ll help.</p>
      {error.digest && <p className="mt-2 text-sm text-muted">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Go to homepage</Link>
      </div>
    </div>
  );
}
