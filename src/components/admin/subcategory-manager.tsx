"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSubcategory, saveSubcategory } from "@/app/actions/admin";
import { slugify } from "@/lib/utils";

export type Subcat = { id: string; categoryId: string; name: string; slug: string; position: number; count: number };

function Row({ sub, onEdit, onMove, onDelete, isFirst, isLast, pending }: { sub: Subcat; onEdit: () => void; onMove: (dir: -1 | 1) => void; onDelete: () => void; isFirst: boolean; isLast: boolean; pending: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="min-w-0 break-words">
        <span className="font-medium">{sub.name}</span>{" "}
        <span className="text-muted">/{sub.slug} · {sub.count} products</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Move up" disabled={isFirst || pending} className="p-1 disabled:opacity-30" onClick={() => onMove(-1)}><ChevronUp className="h-4 w-4" /></button>
        <button type="button" aria-label="Move down" disabled={isLast || pending} className="p-1 disabled:opacity-30" onClick={() => onMove(1)}><ChevronDown className="h-4 w-4" /></button>
        <button type="button" aria-label={`Edit ${sub.name}`} className="p-1" onClick={onEdit}><Pencil className="h-4 w-4" /></button>
        <button
          type="button"
          aria-label={`Delete ${sub.name}`}
          className="p-1 text-danger"
          disabled={pending}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export function SubcategoryManager({ categoryId, items }: { categoryId: string; items: Subcat[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, start] = useTransition();
  const sorted = [...items].sort((a, b) => a.position - b.position);

  function startAdd() {
    setEditingId("new");
    setName("");
    setSlug("");
  }
  function startEdit(sub: Subcat) {
    setEditingId(sub.id);
    setName(sub.name);
    setSlug(sub.slug);
  }
  function cancel() {
    setEditingId(null);
  }

  function remove(sub: Subcat) {
    if (!confirm(`Delete subcategory "${sub.name}"?`)) return;
    start(async () => {
      const r = await deleteSubcategory(sub.id);
      r.ok ? toast.success(r.message ?? "Deleted") : toast.error(r.error);
      router.refresh();
    });
  }

  function save() {
    start(async () => {
      const id = editingId === "new" ? null : editingId;
      const position = id ? (sorted.find((s) => s.id === id)?.position ?? sorted.length) : sorted.length;
      const r = await saveSubcategory(id, { categoryId, name, slug: slug || slugify(name), position });
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(r.message ?? "Saved");
      setEditingId(null);
      router.refresh();
    });
  }

  function move(sub: Subcat, dir: -1 | 1) {
    const idx = sorted.findIndex((s) => s.id === sub.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    start(async () => {
      await Promise.all([
        saveSubcategory(sub.id, { categoryId, name: sub.name, slug: sub.slug, position: swapWith.position }),
        saveSubcategory(swapWith.id, { categoryId, name: swapWith.name, slug: swapWith.slug, position: sub.position }),
      ]);
      router.refresh();
    });
  }

  return (
    <div className="mt-2 border-t border-line pt-2">
      <button type="button" className="text-sm font-medium text-bottle hover:underline" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "Show"} subcategories ({items.length})
      </button>
      {open && (
        <div className="mt-2">
          {sorted.length > 0 && (
            <ul className="divide-y divide-line">
              {sorted.map((sub, i) => (
                <Row key={sub.id} sub={sub} isFirst={i === 0} isLast={i === sorted.length - 1} pending={pending} onEdit={() => startEdit(sub)} onMove={(dir) => move(sub, dir)} onDelete={() => remove(sub)} />
              ))}
            </ul>
          )}
          {editingId ? (
            <div className="mt-3 space-y-2 rounded border border-line p-3">
              <input
                className="field bg-white"
                placeholder="Name"
                value={name}
                maxLength={60}
                autoFocus
                onChange={(e) => setName(e.target.value)}
              />
              <input className="field bg-white text-sm text-muted" placeholder="url-slug" value={slug} maxLength={80} onChange={(e) => setSlug(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" className="btn-primary px-3 py-1.5 text-sm" disabled={pending || name.trim().length < 2} onClick={save}>Save</button>
                <button type="button" className="btn-outline px-3 py-1.5 text-sm" onClick={cancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-bottle hover:underline" onClick={startAdd}>
              <Plus className="h-4 w-4" /> Add subcategory
            </button>
          )}
        </div>
      )}
    </div>
  );
}
