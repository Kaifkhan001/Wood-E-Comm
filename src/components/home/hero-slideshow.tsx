"use client";
import { useEffect, useRef, useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type Slide = { src: string; alt: string };

const SLIDE_MS = 6000;
const FADE_MS = 1200;

export function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const multi = slides.length > 1 && !reducedMotion;

  useEffect(() => {
    if (!multi) return;
    function start() {
      timerRef.current = setInterval(() => setActive((a) => (a + 1) % slides.length), SLIDE_MS);
    }
    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    if (!document.hidden) start();
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [multi, slides.length]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      {slides.map((s, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            aria-hidden={!isActive}
            className="absolute inset-0"
            style={{ opacity: reducedMotion ? (i === 0 ? 1 : 0) : isActive ? 1 : 0, transition: `opacity ${FADE_MS}ms var(--ease-out-soft)` }}
          >
            <div
              key={isActive ? "on" : "off"}
              className="h-full w-full"
              style={multi ? { animation: isActive ? `hero-kenburns ${SLIDE_MS + FADE_MS}ms ease-out forwards` : "none" } : undefined}
            >
              <SmartImage
                src={s.src}
                alt={s.alt}
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        );
      })}
      {multi && (
        // Lifted clear of the fixed WhatsApp dock (a full-width bar on mobile, a round button bottom-6 right-6 on desktop) that floats over every page.
        <div className="absolute bottom-24 right-5 z-10 flex gap-2 lg:right-8">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              aria-current={i === active}
              className={cn("h-2 rounded-full transition-all", i === active ? "w-6 bg-paper" : "w-2 bg-paper/50 hover:bg-paper/80")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
