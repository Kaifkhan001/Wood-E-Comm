"use client";
import { useState } from "react";
import { formatINR } from "@/lib/utils";

/** Lightweight SVG bar chart, no charting library needed. */
export function SalesChart({ data }: { data: { label: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const W = 600, H = 160, gap = 3, bw = W / data.length - gap;
  const shown = hover !== null ? data[hover] : null;
  return (
    <div className="mt-3">
      <p className="text-sm text-muted" aria-live="polite">{shown ? `${shown.label}: ${formatINR(shown.value)}` : `Total ${formatINR(total)}`}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-40 w-full" role="img" aria-label={`Daily confirmed sales, total ${formatINR(total)}`} preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const h = d.value ? Math.max(3, (d.value / max) * (H - 4)) : 2;
          return (
            <rect key={i} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={2}
              className={hover === i ? "fill-brass" : d.value ? "fill-bottle" : "fill-line"} onMouseEnter={() => setHover(i)} />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted"><span>{data[0]?.label}</span><span>{data.at(-1)?.label}</span></div>
    </div>
  );
}
