"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

type Facet = { material: string; n: number };
type Props = { materials: Facet[]; bounds: { min: number; max: number }; total: number };

const SORT_LABELS: Record<string, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  newest: "Newest",
};

const PRICE_BANDS = [
  { label: "Under ₹15,000", min: undefined, max: 15000 },
  { label: "₹15,000 to ₹35,000", min: 15000, max: 35000 },
  { label: "₹35,000 to ₹60,000", min: 35000, max: 60000 },
  { label: "Over ₹60,000", min: 60000, max: undefined },
];

/** All filter state lives in the URL, so results are shareable, indexable and back-button friendly. */
export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) (v ? next.set(k, v) : next.delete(k));
    next.delete("page");
    next.delete("focus");
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, set, pending };
}

function FilterBody({ materials, bounds }: Omit<Props, "total">) {
  const { params, set } = useFilterNav();
  const selected = (params.get("material") ?? "").split(",").filter(Boolean);
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const [minIn, setMinIn] = useState(min);
  const [maxIn, setMaxIn] = useState(max);
  useEffect(() => { setMinIn(min); setMaxIn(max); }, [min, max]);

  const toggleMaterial = (m: string) => {
    const next = selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m];
    set({ material: next.length ? next.join(",") : undefined });
  };

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Material</legend>
        <ul className="space-y-1">
          {materials.map((m) => (
            <li key={m.material}>
              <label className="flex cursor-pointer items-center gap-3 rounded py-1.5 text-[15px]">
                <input type="checkbox" className="h-4 w-4 accent-bottle" checked={selected.includes(m.material)} onChange={() => toggleMaterial(m.material)} />
                <span className="flex-1">{m.material}</span>
                <span className="text-sm text-muted tabular-nums">{m.n}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">Price</legend>
        <ul className="space-y-1">
          {PRICE_BANDS.map((b) => {
            const active = min === String(b.min ?? "") && max === String(b.max ?? "");
            return (
              <li key={b.label}>
                <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[15px]">
                  <input
                    type="radio"
                    name="price-band"
                    className="h-4 w-4 accent-bottle"
                    checked={active}
                    onChange={() => set({ min: b.min ? String(b.min) : undefined, max: b.max ? String(b.max) : undefined })}
                  />
                  {b.label}
                </label>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const lo = minIn.replace(/\D/g, "");
            const hi = maxIn.replace(/\D/g, "");
            set({ min: lo || undefined, max: hi || undefined });
          }}
        >
          <label className="flex-1 text-xs text-muted">
            Min
            <input inputMode="numeric" className="field mt-1 py-2" value={minIn} onChange={(e) => setMinIn(e.target.value)} placeholder={String(bounds.min)} />
          </label>
          <label className="flex-1 text-xs text-muted">
            Max
            <input inputMode="numeric" className="field mt-1 py-2" value={maxIn} onChange={(e) => setMaxIn(e.target.value)} placeholder={String(bounds.max)} />
          </label>
          <button type="submit" className="btn-outline min-h-10 px-4">Go</button>
        </form>
        <p className="mt-2 text-xs text-muted">Range in this category: {formatINR(bounds.min)} to {formatINR(bounds.max)}</p>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-3 text-[15px]">
        <input type="checkbox" className="h-4 w-4 accent-bottle" checked={params.get("inStock") === "1"} onChange={(e) => set({ inStock: e.target.checked ? "1" : undefined })} />
        In stock only
      </label>
    </div>
  );
}

export function Toolbar({ materials, bounds, total }: Props) {
  const { params, set, pending } = useFilterNav();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [drawer, setDrawer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeCount = ["material", "min", "max", "inStock", "q"].filter((k) => params.get(k)).length;

  useEffect(() => setQ(params.get("q") ?? ""), [params]);
  useEffect(() => { if (params.get("focus") === "search") searchRef.current?.focus(); }, [params]);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; }, [drawer]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form role="search" className="relative w-full sm:max-w-xs" onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || undefined }); }}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="shop-search" className="sr-only">Search furniture</label>
          <input ref={searchRef} id="shop-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Search sofas, teak, cane…" className="field rounded-full pl-10" />
        </form>
        <div className="flex items-center justify-between gap-3">
          <p className={cn("text-sm text-muted transition-opacity", pending && "opacity-50")} aria-live="polite">
            {total} {total === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDrawer(true)} className="btn-outline min-h-10 px-4 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
            </button>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select id="sort" value={params.get("sort") ?? "featured"} onChange={(e) => set({ sort: e.target.value === "featured" ? undefined : e.target.value })} className="field min-h-10 w-auto rounded-full py-2 pr-8">
              {Object.entries(SORT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-paper"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="font-semibold">Filters</p>
                <button type="button" onClick={() => setDrawer(false)} className="inline-flex h-10 w-10 items-center justify-center" aria-label="Close filters"><X className="h-5 w-5" /></button>
              </div>
              <div className="overflow-y-auto p-5"><FilterBody materials={materials} bounds={bounds} /></div>
              <div className="flex gap-2 border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
                <button type="button" className="btn-outline flex-1" onClick={() => set({ material: undefined, min: undefined, max: undefined, inStock: undefined, q: undefined })}>Clear all</button>
                <button type="button" className="btn-primary flex-1" onClick={() => setDrawer(false)}>Show {total} results</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function FilterSidebar({ materials, bounds }: Omit<Props, "total">) {
  const { set, params } = useFilterNav();
  const any = ["material", "min", "max", "inStock", "q"].some((k) => params.get(k));
  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <div className="sticky top-28">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-sans text-base font-semibold">Filter</h2>
          {any && <button type="button" className="text-sm text-muted underline underline-offset-4 hover:text-ink" onClick={() => set({ material: undefined, min: undefined, max: undefined, inStock: undefined, q: undefined })}>Clear all</button>}
        </div>
        <FilterBody materials={materials} bounds={bounds} />
      </div>
    </aside>
  );
}
