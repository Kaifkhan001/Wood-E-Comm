import { z } from "zod";

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
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
  .max(80);

export const productImageInput = z.object({
  publicId: z.string().regex(/^[\w\-/]+$/).max(200).nullable().optional(),
  url: z
    .url()
    .refine((u) => /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//.test(u), "Image host not allowed")
    .nullable()
    .optional(),
  alt: text(160).default(""),
});

export const productSchema = z.object({
  name: text(120, 2),
  slug,
  shortDescription: text(200).default(""),
  description: text(5000).default(""),
  categoryId: z.uuid("Choose a category"),
  price: z.coerce.number().int().min(1).max(10_000_000),
  mrp: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  material: text(40, 2),
  color: text(40).default(""),
  dimensions: text(120).default(""),
  stock: z.coerce.number().int().min(0).max(100_000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  images: z.array(productImageInput).max(8),
});

export const categorySchema = z.object({
  name: text(60, 2),
  slug,
  description: text(300).default(""),
  imageUrl: z.union([z.url().refine((u) => u.startsWith("https://"), "Must be https"), z.literal("")]).default(""),
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
