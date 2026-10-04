"use client";
import { useEffect, useState } from "react";
import { slugify } from "@/lib/utils";

/**
 * Shows the slug as a read-only URL preview with an "Edit URL" button, instead
 * of a freely-typable field that normalises on every keystroke -- that was
 * deleting a trailing hyphen while the admin was still typing one. Normalising
 * only happens on blur, so the admin can type freely in between.
 */
export function SlugField({
  value,
  onChange,
  prefix,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix: string;
  hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <div>
        <label className="label-text">URL</label>
        <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-plaster/40 px-3.5 py-2.5">
          <span className="truncate text-[15px] text-muted">
            {prefix}
            <span className="text-ink">{value}</span>
          </span>
          <button type="button" onClick={() => { setDraft(value); setEditing(true); }} className="shrink-0 text-sm font-medium text-bottle underline underline-offset-4 hover:no-underline">
            Edit URL
          </button>
        </div>
        {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="slug-edit" className="label-text">URL slug</label>
      <div className="flex items-center rounded-md border border-line bg-white focus-within:border-bottle">
        <span className="pl-3.5 text-sm text-muted">{prefix}</span>
        <input
          id="slug-edit"
          className="w-full bg-transparent py-2.5 pr-3.5 text-[15px] outline-none"
          value={draft}
          maxLength={200}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const cleaned = slugify(draft);
            setDraft(cleaned);
            onChange(cleaned);
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-xs text-muted">Cleaned up automatically when you click away.</p>
        <button type="button" onClick={() => setEditing(false)} className="shrink-0 text-xs text-muted underline underline-offset-4 hover:text-ink">
          Done
        </button>
      </div>
    </div>
  );
}
