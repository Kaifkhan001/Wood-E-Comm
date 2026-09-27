"use client";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProject, toggleProjectPublished } from "@/app/actions/admin";

export function ProjectRowActions({ id, slug, isPublished, title }: { id: string; slug: string; isPublished: boolean; title: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input type="checkbox" className="h-4 w-4 accent-bottle" checked={isPublished} disabled={pending}
          onChange={(e) => start(async () => { const r = await toggleProjectPublished(id, e.target.checked); if (!r.ok) toast.error(r.error); })} />
        <span className="sr-only">Published</span>
      </label>
      <div className="flex gap-3 text-sm">
        <Link href={`/interior-design/${slug}`} target="_blank" className="text-muted hover:text-ink">View</Link>
        <Link href={`/admin/projects/${id}`} className="hover:underline">Edit</Link>
        <button type="button" disabled={pending} className="text-danger hover:underline"
          onClick={() => {
            if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
            start(async () => { const r = await deleteProject(id); r.ok ? toast.success(r.message ?? "Deleted") : toast.error(r.error); });
          }}>
          Delete
        </button>
      </div>
    </div>
  );
}
