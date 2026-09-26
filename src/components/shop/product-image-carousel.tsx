"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

type Img = { src: string; alt: string };

const AUTO_ADVANCE_MS = 1500;

export function ProductImageCarousel({ images, name, priority }: { images: Img[]; name: string; priority?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start", duration: reducedMotion ? 1 : 18 });
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState(images.length <= 2);
  const autoAdvanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const multi = images.length > 1;

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    embla.on("pointerDown", () => setRevealed(true));
    return () => { embla.off("select", onSelect); };
  }, [embla, onSelect]);

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearInterval(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  const onPointerEnter = useCallback(() => {
    setRevealed(true);
    if (reducedMotion || !multi || !embla) return;
    stopAutoAdvance();
    autoAdvanceTimer.current = setInterval(() => embla.scrollNext(), AUTO_ADVANCE_MS);
  }, [embla, multi, reducedMotion, stopAutoAdvance]);

  const onPointerLeave = useCallback(() => {
    stopAutoAdvance();
    embla?.scrollTo(0);
  }, [embla, stopAutoAdvance]);

  useEffect(() => stopAutoAdvance, [stopAutoAdvance]);

  const scrollPrev = useCallback(
    (e: ReactMouseEvent) => { e.preventDefault(); e.stopPropagation(); stopAutoAdvance(); embla?.scrollPrev(); },
    [embla, stopAutoAdvance],
  );
  const scrollNext = useCallback(
    (e: ReactMouseEvent) => { e.preventDefault(); e.stopPropagation(); stopAutoAdvance(); embla?.scrollNext(); },
    [embla, stopAutoAdvance],
  );
  const scrollTo = useCallback(
    (e: ReactMouseEvent, idx: number) => { e.preventDefault(); e.stopPropagation(); stopAutoAdvance(); embla?.scrollTo(idx); },
    [embla, stopAutoAdvance],
  );

  return (
    <div
      className="group/card relative aspect-[4/5] overflow-hidden rounded-sm bg-cane/30"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div key={img.src + idx} className="relative h-full w-full shrink-0 grow-0 basis-full">
              {(idx < 2 || revealed) && (
                <SmartImage
                  src={img.src}
                  alt={idx === 0 ? img.alt || name : ""}
                  fill
                  priority={idx === 0 && priority}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className={cn(
                    "object-cover",
                    idx === 0 && "transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/card:scale-[1.04]",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {multi && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            tabIndex={-1}
            aria-label="Previous image"
            className="absolute left-1.5 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink opacity-0 shadow transition-opacity group-hover/card:opacity-100 [@media(hover:hover)]:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            tabIndex={-1}
            aria-label="Next image"
            className="absolute right-1.5 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink opacity-0 shadow transition-opacity group-hover/card:opacity-100 [@media(hover:hover)]:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1 [@media(hover:hover)]:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => scrollTo(e, idx)}
                tabIndex={-1}
                aria-label={`Show image ${idx + 1} of ${images.length}`}
                className={cn("h-1.5 rounded-full transition-all", idx === selected ? "w-3 bg-paper" : "w-1.5 bg-paper/60")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
