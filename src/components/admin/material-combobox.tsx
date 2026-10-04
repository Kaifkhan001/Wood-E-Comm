"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { MATERIAL_GROUPS } from "@/lib/catalog-options";
import { cn } from "@/lib/utils";

type Flat = { kind: "option"; value: string; group: string } | { kind: "custom"; value: string };

/** An accessible combobox (WAI-ARIA combobox-with-listbox pattern): shows the
 * grouped default materials on focus, filters as you type, and offers the
 * typed text as a custom value when it doesn't match anything. */
export function MaterialCombobox({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const items: Flat[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched: Flat[] = [];
    for (const g of MATERIAL_GROUPS) {
      for (const opt of g.options) {
        if (!q || opt.toLowerCase().includes(q)) matched.push({ kind: "option", value: opt, group: g.group });
      }
    }
    const exact = matched.some((m) => m.kind === "option" && m.value.toLowerCase() === q);
    if (query.trim() && !exact) matched.push({ kind: "custom", value: query.trim() });
    return matched;
  }, [query]);

  const groups = useMemo(() => {
    const out: { group: string; items: { index: number; item: Flat }[] }[] = [];
    items.forEach((item, index) => {
      const groupName = item.kind === "option" ? item.group : "Custom";
      let g = out.find((x) => x.group === groupName);
      if (!g) { g = { group: groupName, items: [] }; out.push(g); }
      g.items.push({ index, item });
    });
    return out;
  }, [items]);

  function commit(v: string) {
    onChange(v);
    setQuery(v);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && items[activeIndex]) commit(items[activeIndex].value);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        className="field bg-white"
        value={query}
        maxLength={60}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Material" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-line bg-white py-1.5 shadow-lg shadow-ink/10">
          {groups.map((g) => (
            <li key={g.group} role="presentation">
              <p role="presentation" className="px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted first:pt-0.5">{g.group}</p>
              <ul role="group" aria-label={g.group}>
                {g.items.map(({ index, item }) => (
                  <li
                    key={item.value}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={value === item.value}
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-[15px]",
                      index === activeIndex ? "bg-bottle/10" : "hover:bg-plaster/60",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => { e.preventDefault(); commit(item.value); }}
                  >
                    <span>{item.kind === "custom" ? `Use "${item.value}"` : item.value}</span>
                    {value === item.value && <Check className="h-4 w-4 shrink-0 text-bottle" />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
