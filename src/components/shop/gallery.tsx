"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: { src: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0);
  const current = images[i];
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-2 md:flex-col" aria-label="Product images">
          {images.map((img, idx) => (
            <li key={img.src + idx}>
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Show image ${idx + 1} of ${images.length}`}
                aria-current={idx === i}
                className={cn("relative block h-16 w-16 overflow-hidden rounded-sm border-2 md:h-20 md:w-20", idx === i ? "border-bottle" : "border-transparent opacity-70 hover:opacity-100")}
              >
                <SmartImage src={img.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-sm bg-cane/30">
        <AnimatePresence mode="popLayout" initial={false}>
          {current && (
            <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <SmartImage src={current.src} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
