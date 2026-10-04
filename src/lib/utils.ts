import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export const formatINR = (rupees: number) => inr.format(rupees);

const SLUG_MAX = 70;

/**
 * Turns any name into a URL-safe slug that can never come out invalid.
 * Diacritics are stripped (NFKD decomposes "é" into "e" + a combining mark,
 * which is then dropped), "&" becomes "and" so it isn't silently discarded,
 * and truncation happens at a word boundary BEFORE trimming trailing hyphens
 * -- doing it in the other order (trim then truncate) is what let a long name
 * come out ending in "-", which then failed slug validation.
 */
export function slugify(input: string) {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // combining diacritical marks left by NFKD
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = base;
  if (slug.length > SLUG_MAX) {
    const cut = slug.slice(0, SLUG_MAX);
    const lastHyphen = cut.lastIndexOf("-");
    slug = (lastHyphen > SLUG_MAX * 0.4 ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
  }

  return slug || `product-${Math.random().toString(36).slice(2, 8)}`;
}

export function discountPercent(price: number, mrp: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export const orderNumber = (n: number) => `WW-${String(n).padStart(5, "0")}`;
