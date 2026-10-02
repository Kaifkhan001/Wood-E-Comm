"use client";
import { cn } from "@/lib/utils";

/**
 * Save + Discard controls for admin forms. Disabled (grey) while nothing has
 * changed, primary-coloured once dirty, "Saving…" while in flight, and a brief
 * "Saved" after success. Sticks to the bottom of the viewport on mobile while dirty.
 */
export function SaveBar({
  dirty,
  pending,
  saved,
  onDiscard,
  saveLabel = "Save changes",
  creating = false,
  discardConfirm,
}: {
  dirty: boolean;
  pending: boolean;
  saved: boolean;
  onDiscard?: () => void;
  saveLabel?: string;
  /** True for a "create new" form with no baseline: the save button is always enabled. */
  creating?: boolean;
  /** If set, confirm() with this text before discarding. */
  discardConfirm?: string;
}) {
  const label = pending ? "Saving…" : saved ? "Saved" : saveLabel;
  const disabled = pending || (!creating && !dirty);

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        dirty &&
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
      )}
    >
      <button type="submit" className="btn-primary flex-1 sm:flex-none" disabled={disabled}>
        {label}
      </button>
      {onDiscard && (
        <button
          type="button"
          className="btn-outline flex-1 sm:flex-none"
          disabled={pending || !dirty}
          onClick={() => {
            if (discardConfirm && !confirm(discardConfirm)) return;
            onDiscard();
          }}
        >
          Discard changes
        </button>
      )}
    </div>
  );
}
