import { z } from "zod";
import { slugify } from "./utils";

/** Plain-text sanitiser: trims, removes control chars and any HTML tags. */
export const clean = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

export const text = (max: number, min = 0) =>
  z.string().max(max * 2).transform(clean).pipe(z.string().min(min).max(max));

export const indianPhone = z
  .string()
  .transform((s) => s.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

export const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email").max(200));

/* ── Storefront filters (from URL search params — untrusted) ── */
export const SORTS = ["featured", "price-asc", "price-desc", "newest"] as const;

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const toInt = (v: unknown) => {
  const n = Number.parseInt(String(first(v) ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export const filterSchema = z.object({
  q: z.preprocess((v) => (typeof first(v) === "string" ? clean(String(first(v))).slice(0, 80) : undefined), z.string().optional()),
  min: z.preprocess(toInt, z.number().int().max(10_000_000).optional()),
  max: z.preprocess(toInt, z.number().int().max(10_000_000).optional()),
  material: z.preprocess(
    (v) =>
      (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [])
        .map((m) => clean(String(m)).slice(0, 40))
        .filter(Boolean)
        .slice(0, 10),
    z.array(z.string()),
  ),
  sort: z.preprocess(first, z.enum(SORTS).catch("featured")).default("featured"),
  page: z.preprocess(toInt, z.number().int().min(1).max(500).catch(1)).default(1),
  inStock: z.preprocess((v) => first(v) === "1", z.boolean()),
});
export type Filters = z.infer<typeof filterSchema>;

/** Counts how many distinct kinds of filter are active in a listing page's URL
 * (material, a price range, in-stock-only, search text, and any active spec
 * filter each count as one), used to decide noindex,follow for filter combos
 * that are too numerous to be worth indexing individually. */
export function countActiveFilters(sp: Record<string, string | string[] | undefined>, specKeys: string[] = []): number {
  let n = ["material", "q", ...specKeys].filter((k) => sp[k]).length;
  if (sp.min || sp.max) n++;
  if (sp.inStock) n++;
  return n;
}

/* ── Forms ── */
export const leadSchema = z.object({
  phone: indianPhone,
  consent: z.literal(true, { error: "Please accept the terms to continue" }),
});

export const contactSchema = z.object({
  name: text(80, 2),
  email,
  phone: z.union([indianPhone, z.literal("")]).default(""),
  message: text(2000, 10),
});

export const QUOTE_SCOPES = ["Full home", "Modular kitchen", "Wardrobes", "Living room", "Bedroom", "False ceiling & lighting", "Office"] as const;
export const PROPERTY_TYPES = ["Apartment", "Villa / Bungalow", "Office", "Shop / Studio"] as const;
export const HOME_SIZES = ["1 BHK", "2 BHK", "3 BHK", "4+ BHK", "Not applicable"] as const;
export const BUDGETS = ["Under ₹5 lakh", "₹5–10 lakh", "₹10–20 lakh", "₹20 lakh+", "Not sure yet"] as const;
export const TIMELINES = ["Within 1 month", "1–3 months", "3–6 months", "Just exploring"] as const;

export const quoteSchema = z.object({
  name: text(80, 2),
  phone: indianPhone,
  email: z.union([email, z.literal("")]).default(""),
  city: text(60, 2),
  propertyType: z.enum(PROPERTY_TYPES),
  homeSize: z.enum(HOME_SIZES),
  scope: z.array(z.enum(QUOTE_SCOPES)).min(1, "Pick at least one area").max(QUOTE_SCOPES.length),
  budget: z.enum(BUDGETS),
  timeline: z.enum(TIMELINES),
  message: text(1500).default(""),
});

export const orderSchema = z.object({
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(10) }))
    .min(1, "Your cart is empty")
    .max(30),
  customerName: text(80, 2),
  phone: indianPhone,
  addressLine1: text(160, 5),
  addressLine2: text(160).default(""),
  city: text(60, 2),
  state: text(60, 2),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  notes: text(500).default(""),
});

/* ── Admin ── */
// Normalises instead of rejecting: slugify() always returns a valid, non-empty
// slug (falling back to a random one for input that's entirely symbols/emoji),
// so there's nothing left here to reject. Uniqueness (appending -2, -3…) is
// handled in the action, since that needs a database lookup.
export const slug = z.string().max(400).transform((s) => slugify(s));

export const productImageInput = z.object({
  publicId: z.string().regex(/^[\w\-/]+$/).max(200).nullable().optional(),
  url: z
    .url()
    .refine((u) => /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//.test(u), "Image host not allowed")
    .nullable()
    .optional(),
  alt: text(160).default(""),
  fit: z.enum(["contain", "cover"]).default("contain"),
});

// Drizzle's numeric() columns store/return strings (a JS number can't safely
// represent arbitrary-precision decimals), so a validated measurement is
// coerced to a number just to check it's sane, then turned back into a string.
const optionalMeasurement = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z
      .union([z.null(), z.coerce.number().min(0).max(max).transform((n) => String(n))])
      .optional(),
  );

export const assembly = z.enum(["not_required", "required", "free_installation"]).nullable().optional();

export const highlightsSchema = z.array(text(250)).max(10).default([]);

export const productSchema = z.object({
  name: text(120, 2),
  slug,
  shortDescription: text(200).default(""),
  description: text(5000).default(""),
  categoryId: z.uuid("Choose a category"),
  subcategoryId: z.uuid().nullable().optional(),
  price: z.coerce.number().int().min(1).max(10_000_000),
  mrp: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  material: text(40, 2),
  color: text(40).default(""),
  dimensions: text(120).default(""),
  stock: z.coerce.number().int().min(0).max(100_000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  images: z.array(productImageInput).max(8),
  // Amazon-style specifications, all optional.
  brand: text(80).default(""),
  sku: z
    .string()
    .max(60)
    .transform((s) => clean(s))
    .pipe(z.string().max(60))
    .nullable()
    .optional()
    .transform((s) => (s ? s : null)),
  widthCm: optionalMeasurement(1000),
  depthCm: optionalMeasurement(1000),
  heightCm: optionalMeasurement(1000),
  weightKg: optionalMeasurement(1000),
  assembly,
  warrantyMonths: z.coerce.number().int().min(0).max(600).nullable().optional(),
  countryOfOrigin: text(60).default(""),
  highlights: highlightsSchema,
  // Validated against the category's template server side (see catalog-options.ts
  // parseSpecs), since that needs a DB lookup for the category's slug -- here we
  // only make sure it's a plain object so it's safe to pass along.
  specs: z.record(z.string(), z.unknown()).default({}),
});

export const categorySchema = z.object({
  name: text(60, 2),
  slug,
  description: text(300).default(""),
  imageUrl: z.union([z.url().refine((u) => u.startsWith("https://"), "Must be https"), z.literal("")]).default(""),
  position: z.coerce.number().int().min(0).max(1000).default(0),
});

export const subcategorySchema = z.object({
  categoryId: z.uuid("Choose a category"),
  name: text(60, 2),
  slug,
  description: text(300).default(""),
  position: z.coerce.number().int().min(0).max(1000).default(0),
});

const projectImageUrl = z
  .url()
  .refine((u) => /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//.test(u), "Image host not allowed");

export const projectSchema = z.object({
  title: text(120, 2),
  slug,
  location: text(80, 2),
  homeType: text(40, 2),
  style: text(40, 2),
  areaSqft: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
  durationWeeks: z.coerce.number().int().min(0).max(520).nullable().optional(),
  summary: text(2000, 10),
  images: z.array(projectImageUrl).min(1, "Add at least one image").max(12),
  isPublished: z.boolean(),
  position: z.coerce.number().int().min(0).max(1000).default(0),
});

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function zodErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
