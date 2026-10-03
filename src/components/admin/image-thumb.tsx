"use client";
import { useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";

/** A small product/project thumbnail that flags a failed load instead of silently showing a placeholder. */
export function AdminImageThumb({ src, sizes, className }: { src: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <SmartImage src={src} alt="" fill sizes={sizes} className={className} onError={() => setFailed(true)} />
      {failed && (
        <span className="absolute inset-x-0 bottom-0 bg-danger px-1 py-0.5 text-center text-[9px] font-medium leading-tight text-white">Failed</span>
      )}
    </>
  );
}
