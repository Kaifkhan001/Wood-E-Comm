"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { imageSrc } from "@/lib/images";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

type SourceImg = { publicId?: string | null; url?: string | null; alt: string };
type Img = { thumb: string; main: string; full: string; alt: string };

export function Gallery({ images: source, name }: { images: SourceImg[]; name: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const openLightbox = useCallback((idx: number) => {
    setStartIndex(idx);
    setLightboxOpen(true);
  }, []);

  if (source.length === 0) {
    return <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-sm bg-cane/30" />;
  }

  // The gallery never crops: it shows the whole product (c_pad), while
  // thumbnails and the fullscreen viewer get their own context-appropriate crop.
  const images: Img[] = source.map((img) => ({
    thumb: imageSrc(img, 160, { fit: "thumb" }),
    main: imageSrc(img, 1200, { fit: "contain", ar: "4:5" }),
    full: imageSrc(img, 2400, { fit: "limit" }),
    alt: img.alt,
  }));

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <MainViewer images={images} name={name} reducedMotion={reducedMotion} onExpand={openLightbox} />
      {lightboxOpen &&
        createPortal(
          <Lightbox images={images} name={name} startIndex={startIndex} reducedMotion={reducedMotion} onClose={() => setLightboxOpen(false)} />,
          document.body,
        )}
    </div>
  );
}

function MainViewer({
  images,
  name,
  reducedMotion,
  onExpand,
}: {
  images: Img[];
  name: string;
  reducedMotion: boolean;
  onExpand: (idx: number) => void;
}) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "start", duration: reducedMotion ? 1 : 20 });
  const [selected, setSelected] = useState(0);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const multi = images.length > 1;

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  useEffect(() => {
    thumbRefs.current[selected]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [selected, reducedMotion]);

  const scrollTo = useCallback((idx: number) => embla?.scrollTo(idx), [embla]);
  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); scrollNext(); }
    },
    [scrollPrev, scrollNext],
  );

  return (
    <>
      {multi && (
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Product images">
          {images.map((img, idx) => (
            <li key={idx} className="shrink-0">
              <button
                ref={(el) => { thumbRefs.current[idx] = el; }}
                type="button"
                onClick={() => scrollTo(idx)}
                aria-label={`Show image ${idx + 1} of ${images.length}`}
                aria-current={idx === selected}
                className={cn(
                  "relative block h-16 w-16 overflow-hidden rounded-sm border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bottle md:h-20 md:w-20",
                  idx === selected ? "border-bottle" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <SmartImage src={img.thumb} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        className="group/gallery relative aspect-[4/5] w-full min-w-0 flex-1 overflow-hidden rounded-sm bg-cane/30 focus:outline-none"
        tabIndex={multi ? 0 : -1}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
        onKeyDown={onKeyDown}
      >
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative h-full w-full shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`Image ${idx + 1} of ${images.length}`}
              >
                <button
                  type="button"
                  className="absolute inset-0 h-full w-full cursor-zoom-in"
                  onClick={() => onExpand(idx)}
                  aria-label={`Expand image ${idx + 1} of ${images.length}`}
                >
                  <SmartImage
                    src={img.main}
                    alt={img.alt || name}
                    fill
                    priority={idx === 0}
                    loading={idx === 0 ? undefined : Math.abs(idx - selected) <= 1 ? "eager" : "lazy"}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-contain"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {multi && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink opacity-0 shadow transition-opacity focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bottle group-hover/gallery:opacity-100 [@media(hover:hover)]:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next image"
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-ink opacity-0 shadow transition-opacity focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bottle group-hover/gallery:opacity-100 [@media(hover:hover)]:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink/50 px-3 py-1.5 text-xs text-paper backdrop-blur-sm">
              <span aria-hidden className="tabular-nums">{selected + 1} / {images.length}</span>
              <span className="sr-only" aria-live="polite">Image {selected + 1} of {images.length}</span>
            </div>
            <span className="absolute right-3 top-3 hidden h-8 w-8 items-center justify-center rounded-full bg-ink/40 text-paper [@media(hover:hover)]:flex">
              <ZoomIn className="h-4 w-4" />
            </span>
          </>
        )}
      </div>
    </>
  );
}

function Lightbox({
  images,
  name,
  startIndex,
  reducedMotion,
  onClose,
}: {
  images: Img[];
  name: string;
  startIndex: number;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const zoomedRef = useRef(false);
  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    startIndex,
    duration: reducedMotion ? 1 : 20,
    watchDrag: (_api, event) => !zoomedRef.current,
  });
  const [selected, setSelected] = useState(startIndex);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    return () => { embla.off("select", onSelect); };
  }, [embla, onSelect]);

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  // Lock body scroll, trap focus, restore focus and Esc-to-close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowLeft") { scrollPrev(); return; }
      if (e.key === "ArrowRight") { scrollNext(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [onClose, scrollPrev, scrollNext]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} image viewer`}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95"
    >
      <div className="flex items-center justify-between px-4 py-3 text-paper">
        <span className="tabular-nums text-sm">{selected + 1} / {images.length}</span>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden" ref={emblaRef} aria-roledescription="carousel" role="group" aria-label={`${name} images`}>
        <div className="flex h-full">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative h-full w-full shrink-0 grow-0 basis-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`Image ${idx + 1} of ${images.length}`}
            >
              <ZoomableImage
                img={img}
                name={name}
                active={idx === selected}
                onZoomChange={(z) => { if (idx === selected) zoomedRef.current = z; }}
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/10 text-paper hover:bg-paper/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/10 text-paper hover:bg-paper/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

const ZOOM = 2;

function ZoomableImage({ img, name, active, onZoomChange }: { img: Img; name: string; active: boolean; onZoomChange: (zoomed: boolean) => void }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) { setZoomed(false); setPan({ x: 0, y: 0 }); }
  }, [active]);

  useEffect(() => { onZoomChange(zoomed); }, [zoomed, onZoomChange]);

  const toggleZoom = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const ox = ((clientX - rect.left) / rect.width) * 100;
      const oy = ((clientY - rect.top) / rect.height) * 100;
      setOrigin(`${ox}% ${oy}%`);
    }
    setPan({ x: 0, y: 0 });
    setZoomed((z) => !z);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!zoomed) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!zoomed || !dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  };
  const onPointerUp = () => { dragState.current = null; };

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full overflow-hidden touch-none", zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in")}
      onDoubleClick={(e) => toggleZoom(e.clientX, e.clientY)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="relative h-full w-full transition-transform duration-200 ease-out"
        style={{
          transform: zoomed ? `translate(${pan.x}px, ${pan.y}px) scale(${ZOOM})` : "scale(1)",
          transformOrigin: origin,
        }}
      >
        <SmartImage src={img.full} alt={img.alt || name} fill sizes="100vw" className="object-contain" draggable={false} />
      </div>
    </div>
  );
}
