"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrder, updateQuote } from "@/app/actions/admin";
import { STATUS_LABEL } from "./ui";

/** Status + internal notes editor shared by orders and quotes. */
export function StatusEditor({
  kind, id, status, notes, statuses, hint,
}: { kind: "order" | "quote"; id: string; status: string; notes: string; statuses: readonly string[]; hint?: string }) {
  const [s, setS] = useState(status);
  const [n, setN] = useState(notes);
  const [pending, start] = useTransition();
  const dirty = s !== status || n !== notes;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const fn = kind === "order" ? updateOrder : updateQuote;
          const r = await fn(id, { status: s, adminNotes: n });
          r.ok ? toast.success(r.message ?? "Saved") : toast.error(r.error);
          if (!r.ok) setS(status);
        });
      }}
    >
      <div>
        <label htmlFor={`st-${id}`} className="label-text">Status</label>
        <select id={`st-${id}`} className="field bg-white" value={s} onChange={(e) => setS(e.target.value)}>
          {statuses.map((x) => <option key={x} value={x}>{STATUS_LABEL[x] ?? x}</option>)}
        </select>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      <div>
        <label htmlFor={`nt-${id}`} className="label-text">Internal notes <span className="font-normal text-muted">(customers never see these)</span></label>
        <textarea id={`nt-${id}`} rows={4} className="field bg-white" maxLength={2000} value={n} onChange={(e) => setN(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary" disabled={pending || !dirty}>{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
