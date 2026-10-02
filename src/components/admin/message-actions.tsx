"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { setMessagesResolved } from "@/app/actions/admin";

export function ResolveButton({ id, resolved }: { id: string; resolved: boolean }) {
  const [pending, start] = useTransition();

  function set(next: boolean) {
    start(async () => {
      const r = await setMessagesResolved([id], next);
      if (!r.ok) { toast.error(r.error); return; }
      toast(next ? "Marked as replied" : "Reopened", {
        duration: 5000,
        action: { label: "Undo", onClick: () => set(!next) },
      });
    });
  }

  return (
    <button type="button" disabled={pending} className="btn-outline min-h-9 px-3 text-sm" onClick={() => set(!resolved)}>
      {resolved ? "Reopen" : "Mark as replied"}
    </button>
  );
}
