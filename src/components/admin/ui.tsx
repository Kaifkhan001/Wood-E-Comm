import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-[34px] leading-tight">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-line bg-white p-5", className)}>{children}</div>;
}

const TONES: Record<string, string> = {
  requested: "bg-brass/15 text-sheesham", new: "bg-brass/15 text-sheesham",
  confirmed: "bg-bottle/10 text-bottle", contacted: "bg-bottle/10 text-bottle", site_visit: "bg-bottle/10 text-bottle", quoted: "bg-bottle/10 text-bottle", in_production: "bg-bottle/10 text-bottle", shipped: "bg-bottle/10 text-bottle",
  delivered: "bg-bottle text-paper", won: "bg-bottle text-paper",
  cancelled: "bg-ink/10 text-muted", lost: "bg-ink/10 text-muted",
};
export const STATUS_LABEL: Record<string, string> = {
  requested: "Requested", confirmed: "Confirmed", in_production: "In production", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
  new: "New", contacted: "Contacted", site_visit: "Site visit", quoted: "Quoted", won: "Won", lost: "Lost",
};
export function StatusPill({ status }: { status: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[status] ?? "bg-ink/10")}>{STATUS_LABEL[status] ?? status}</span>;
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-line bg-white", className)}>
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_th]:text-muted [&_thead]:border-b [&_thead]:border-line [&_tbody_tr]:border-b [&_tbody_tr]:border-line/70 [&_tbody_tr:last-child]:border-0">
        {children}
      </table>
    </div>
  );
}

/** A card-per-row list for narrow screens, shown instead of a squeezed table. */
export function CardList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("space-y-3", className)}>{children}</ul>;
}

export function CardRow({ children, href }: { children: React.ReactNode; href?: string }) {
  return (
    <li className="relative rounded-lg border border-line bg-white p-4">
      {href && <Link href={href} className="absolute inset-0" aria-label="Open" />}
      <div className="relative space-y-1.5 text-sm">{children}</div>
    </li>
  );
}

export function CardField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center text-muted">{children}</div>;
}
