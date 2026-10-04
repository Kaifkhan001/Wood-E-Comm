"use client";
import { useRef } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

/** An editable bullet list ("About this item"): add, remove, reorder, or paste
 * several lines at once to split them into separate bullets automatically. */
export function HighlightsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const dragIndex = useRef<number | null>(null);

  function update(i: number, text: string) {
    onChange(value.map((v, j) => (j === i ? text : v)));
  }
  function remove(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }
  function add() {
    if (value.length >= 10) return;
    onChange([...value, ""]);
  }
  function onPaste(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return; // let the default single-line paste happen
    e.preventDefault();
    const next = [...value];
    next.splice(i, 1, ...lines.slice(0, 10 - value.length + 1));
    onChange(next.slice(0, 10));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="label-text mb-0">About this item <span className="font-normal text-muted">(bullet points, optional)</span></h3>
        <span className="text-xs text-muted">{value.length}/10</span>
      </div>
      <ul className="mt-2 space-y-2">
        {value.map((line, i) => (
          <li
            key={i}
            className="flex items-center gap-2"
            draggable
            onDragStart={() => { dragIndex.current = i; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragIndex.current;
              if (from === null || from === i) return;
              const next = [...value];
              const [moved] = next.splice(from, 1);
              next.splice(i, 0, moved);
              onChange(next);
              dragIndex.current = null;
            }}
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" aria-hidden />
            <input
              aria-label={`Highlight ${i + 1}`}
              className="field bg-white"
              value={line}
              maxLength={250}
              onChange={(e) => update(i, e.target.value)}
              onPaste={(e) => onPaste(i, e)}
              placeholder="e.g. Solid sheesham wood frame, built to last"
            />
            <button type="button" onClick={() => remove(i)} className="shrink-0 p-1.5 text-danger" aria-label={`Remove highlight ${i + 1}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {value.length < 10 && (
        <button type="button" onClick={add} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-bottle hover:underline">
          <Plus className="h-4 w-4" /> Add a line
        </button>
      )}
    </div>
  );
}
