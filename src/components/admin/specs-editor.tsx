"use client";
import { specFieldsFor, type SpecField } from "@/lib/catalog-options";

export type SpecValue = string | number | boolean | string[];
export type SpecsValue = Record<string, SpecValue>;

function Field({ field, value, onChange }: { field: SpecField; value: SpecValue | undefined; onChange: (v: SpecValue | undefined) => void }) {
  const id = `spec-${field.key}`;
  if (field.type === "boolean") {
    return (
      <label htmlFor={id} className="flex items-center justify-between gap-3 py-1">
        <span className="text-sm font-medium">{field.label}</span>
        <input id={id} type="checkbox" className="h-5 w-5 accent-bottle" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label htmlFor={id} className="label-text">{field.label}</label>
        <select id={id} className="field bg-white" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Not specified</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className="label-text">{field.label}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-bottle"
                checked={selected.includes(o)}
                onChange={(e) => {
                  const next = e.target.checked ? [...selected, o] : selected.filter((s) => s !== o);
                  onChange(next.length ? next : undefined);
                }}
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (field.type === "number") {
    return (
      <div>
        <label htmlFor={id} className="label-text">{field.label} {field.unit && <span className="font-normal text-muted">({field.unit})</span>}</label>
        <input
          id={id}
          inputMode="decimal"
          className="field bg-white"
          value={value === undefined ? "" : String(value)}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.]/g, "");
            onChange(v === "" ? undefined : v);
          }}
        />
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label-text">{field.label}</label>
      <input id={id} className="field bg-white" value={typeof value === "string" ? value : ""} maxLength={300} onChange={(e) => onChange(e.target.value || undefined)} />
    </div>
  );
}

/** Renders the right spec fields for the chosen category (plus the fields common
 * to every category); values for keys that exist in both templates are kept when
 * the category changes. */
export function SpecsEditor({ categorySlug, value, onChange }: { categorySlug: string | undefined; value: SpecsValue; onChange: (v: SpecsValue) => void }) {
  const fields = specFieldsFor(categorySlug);
  function set(key: string, v: SpecValue | undefined) {
    const next = { ...value };
    if (v === undefined) delete next[key];
    else next[key] = v;
    onChange(next);
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={f.type === "multiselect" ? "sm:col-span-2" : undefined}>
          <Field field={f} value={value[f.key]} onChange={(v) => set(f.key, v)} />
        </div>
      ))}
    </div>
  );
}
