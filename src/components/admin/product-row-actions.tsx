"use client";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct, toggleProductActive } from "@/app/actions/admin";

export function ProductRowActions({ id, slug, isActive, name }: { id: string; slug: string; isActive: boolean; name: string }) {
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    start(async () => {
      const r = await toggleProductActive(id, next);
      if (!r.ok) { toast.error(r.error); return; }
      toast(next ? "Visible in store" : "Hidden from store", {
        duration: 5000,
        action: { label: "Undo", onClick: () => toggle(!next) },
      });
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input type="checkbox" className="h-4 w-4 accent-bottle" checked={isActive} disabled={pending} onChange={(e) => toggle(e.target.checked)} />
        <span className="sr-only">Visible in store</span>
      </label>
      <div className="flex gap-3 text-sm">
        <Link href={`/product/${slug}`} target="_blank" className="text-muted hover:text-ink">View</Link>
        <Link href={`/admin/products/${id}`} className="hover:underline">Edit</Link>
        <button type="button" disabled={pending} className="text-danger hover:underline"
          onClick={() => {
            if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
            start(async () => { const r = await deleteProduct(id); r.ok ? toast.success(r.message ?? "Deleted") : toast.error(r.error); });
          }}>
          Delete
        </button>
      </div>
    </div>
  );
}
