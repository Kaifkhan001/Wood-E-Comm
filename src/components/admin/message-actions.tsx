"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { setMessagesResolved } from "@/app/actions/admin";

export function ResolveButton({ id, resolved }: { id: string; resolved: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn-outline min-h-9 px-3 text-sm"
      onClick={() => start(async () => { const r = await setMessagesResolved([id], !resolved); if (!r.ok) toast.error(r.error); })}>
      {resolved ? "Reopen" : "Mark as replied"}
    </button>
  );
}
