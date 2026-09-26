"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { slugify } from "@/lib/utils";

type Cat = { id: string; name: string; slug: string; description: string; imageUrl: string | null; position: number; count: number };
const EMPTY = { name: "", slug: "", description: "", imageUrl: "", position: "0" };

export function CategoryManager({ items }: { items: Cat[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const edit = (c: Cat) => {
    setEditing(c.id);
    setErrors({});
    setF({ name: c.name, slug: c.slug, description: c.description, imageUrl: c.imageUrl ?? "", position: String(c.position) });
  };
  const reset = () => { setEditing(null); setF(EMPTY); setErrors({}); };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {items.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{c.name} <span className="text-sm font-normal text-muted">/furniture/{c.slug}</span></p>
              <p className="text-sm text-muted">{c.count} products, position {c.position}</p>
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" className="hover:underline" onClick={() => edit(c)}>Edit</button>
              <button type="button" className="text-danger hover:underline" disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete category "${c.name}"?`)) return;
                  start(async () => { const r = await deleteCategory(c.id); r.ok ? toast.success(r.message ?? "Deleted") : toast.error(r.error); if (editing === c.id) reset(); });
                }}>Delete</button>
            </div>
          </li>
        ))}
        {!items.length && <li className="p-6 text-center text-muted">No categories yet. Add one to start listing products.</li>}
      </ul>

      <form
        noValidate
        className="h-fit space-y-4 rounded-lg border border-line bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await saveCategory(editing, f);
            if (!r.ok) { setErrors(r.fieldErrors ?? {}); toast.error(r.error); return; }
            toast.success(r.message ?? "Saved");
            reset();
          });
        }}
      >
        <h2 className="font-sans text-base font-semibold">{editing ? "Edit category" : "Add category"}</h2>
        <div>
          <label htmlFor="c-name" className="label-text">Name</label>
          <input id="c-name" className="field bg-white" value={f.name} maxLength={60}
            onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: editing ? s.slug : slugify(e.target.value) }))} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-slug" className="label-text">URL slug</label>
          <input id="c-slug" className="field bg-white" value={f.slug} maxLength={80} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} />
          {errors.slug && <p className="field-error">{errors.slug}</p>}
        </div>
        <div>
          <label htmlFor="c-desc" className="label-text">Description <span className="font-normal text-muted">(shown on the category page)</span></label>
          <textarea id="c-desc" rows={3} className="field bg-white" value={f.description} maxLength={300} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        <div>
          <label htmlFor="c-img" className="label-text">Image URL <span className="font-normal text-muted">(https)</span></label>
          <input id="c-img" className="field bg-white" value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} />
          {errors.imageUrl && <p className="field-error">{errors.imageUrl}</p>}
        </div>
        <div>
          <label htmlFor="c-pos" className="label-text">Position</label>
          <input id="c-pos" inputMode="numeric" className="field max-w-[120px] bg-white" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value.replace(/\D/g, "") })} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Add category"}</button>
          {editing && <button type="button" className="btn-outline" onClick={reset}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
