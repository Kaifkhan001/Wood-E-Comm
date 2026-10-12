// Shared catalogue vocabulary: the admin product form and the storefront
// filters both read from here, so a material or spec option only needs to be
// defined once.
import { clean } from "./validators";

export const MATERIAL_GROUPS = [
  {
    group: "Solid wood",
    options: ["Sheesham wood", "Teak wood", "Mango wood", "Acacia wood", "Oak wood", "Walnut wood", "Rubberwood", "Pine wood", "Neem wood", "Babool wood"],
  },
  {
    group: "Engineered",
    options: ["Engineered wood", "Plywood", "MDF", "Particle board"],
  },
  {
    group: "Other",
    options: ["Cane & rattan", "Metal", "Wood & metal", "Marble", "Glass", "Fabric upholstery", "Leatherette", "Velvet upholstery"],
  },
] as const;

export const ALL_MATERIALS: string[] = MATERIAL_GROUPS.flatMap((g) => g.options);

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\bwood\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/* ───────────────────────── Category spec templates ───────────────────────── */

export type SpecFieldType = "select" | "multiselect" | "number" | "text" | "boolean";

export type SpecGroup = "Dimensions & weight" | "Materials" | "Features" | "Warranty & care";

export type SpecField = {
  key: string;
  label: string;
  type: SpecFieldType;
  unit?: string;
  options?: readonly string[];
  /** Shown as a filter on the category's listing page, with facet counts from real data. */
  filterable?: boolean;
  /** Which group the product-page specifications table shows this under. */
  group?: SpecGroup;
};

// Fields shown for every product regardless of category. Brand, SKU, colour/finish,
// dimensions, weight, assembly, warranty and country of origin all have their own
// columns on `products` (not stored in `specs`); only `care` and `roomType` and
// `piecesInBox` live in the specs jsonb since they have no dedicated column.
export const COMMON_SPEC_FIELDS: SpecField[] = [
  { key: "care", label: "Care instructions", type: "text", group: "Warranty & care" },
  { key: "roomType", label: "Room type", type: "multiselect", options: ["Living room", "Bedroom", "Dining room", "Study", "Office", "Outdoor"], group: "Features" },
  { key: "piecesInBox", label: "Number of pieces in the box", type: "number", group: "Features" },
];

export const SPEC_TEMPLATES: Record<string, SpecField[]> = {
  sofas: [
    { key: "seatingCapacity", label: "Seating capacity", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8+"], filterable: true, group: "Features" },
    { key: "seatHeight", label: "Seat height", type: "number", unit: "cm", group: "Dimensions & weight" },
    { key: "seatDepth", label: "Seat depth", type: "number", unit: "cm", group: "Dimensions & weight" },
    { key: "weightLimit", label: "Weight limit", type: "number", unit: "kg", group: "Dimensions & weight" },
    { key: "upholsteryMaterial", label: "Upholstery material", type: "select", options: ["Fabric", "Velvet", "Leatherette", "Genuine leather", "Cane", "None"], filterable: true, group: "Materials" },
    { key: "frameMaterial", label: "Frame material", type: "text", group: "Materials" },
    { key: "cushionType", label: "Cushion type", type: "select", options: ["Foam", "Fibre", "Foam + fibre", "Feather"], group: "Features" },
    { key: "removableCovers", label: "Removable covers", type: "boolean", group: "Features" },
    { key: "style", label: "Style", type: "select", options: ["Modern", "Contemporary", "Mid-century", "Traditional", "Chesterfield", "Scandinavian"], group: "Features" },
  ],
  beds: [
    { key: "bedSize", label: "Bed size", type: "select", options: ["Single", "Double", "Queen", "King", "Super king"], filterable: true, group: "Dimensions & weight" },
    { key: "storage", label: "Storage", type: "select", options: ["None", "Box storage", "Hydraulic storage", "Drawer storage"], filterable: true, group: "Features" },
    { key: "headboardType", label: "Headboard type", type: "text", group: "Features" },
    { key: "mattressIncluded", label: "Mattress included", type: "boolean", group: "Features" },
    { key: "recommendedMattressSize", label: "Recommended mattress size", type: "text", group: "Dimensions & weight" },
    { key: "weightLimit", label: "Weight limit", type: "number", unit: "kg", group: "Dimensions & weight" },
  ],
  dining: [
    { key: "seatingCapacity", label: "Seating capacity", type: "select", options: ["2", "4", "6", "8", "10", "12"], filterable: true, group: "Features" },
    { key: "tableShape", label: "Table shape", type: "select", options: ["Rectangular", "Round", "Square", "Oval"], filterable: true, group: "Features" },
    { key: "tableTopMaterial", label: "Table top material", type: "text", group: "Materials" },
    { key: "chairsIncluded", label: "Chairs included", type: "number", group: "Features" },
    { key: "extendable", label: "Extendable", type: "boolean", group: "Features" },
  ],
  chairs: [
    { key: "chairType", label: "Chair type", type: "select", options: ["Accent", "Lounge", "Rocking", "Dining", "Study/office", "Bar stool"], filterable: true, group: "Features" },
    { key: "armrests", label: "Armrests", type: "boolean", group: "Features" },
    { key: "seatHeight", label: "Seat height", type: "number", unit: "cm", group: "Dimensions & weight" },
    { key: "weightLimit", label: "Weight limit", type: "number", unit: "kg", group: "Dimensions & weight" },
    { key: "upholsteryMaterial", label: "Upholstery material", type: "text", group: "Materials" },
  ],
  storage: [
    { key: "doors", label: "Number of doors", type: "number", filterable: true, group: "Features" },
    { key: "drawers", label: "Number of drawers", type: "number", group: "Features" },
    { key: "shelves", label: "Number of shelves", type: "number", group: "Features" },
    { key: "mirror", label: "Mirror", type: "boolean", group: "Features" },
    { key: "lock", label: "Lock", type: "boolean", group: "Features" },
    { key: "mounting", label: "Mounting", type: "select", options: ["Floor standing", "Wall mounted"], group: "Features" },
  ],
  tables: [
    { key: "tableShape", label: "Table shape", type: "select", options: ["Rectangular", "Round", "Square", "Oval"], filterable: true, group: "Features" },
    { key: "tableTopMaterial", label: "Table top material", type: "text", group: "Materials" },
    { key: "storage", label: "Storage", type: "boolean", group: "Features" },
    { key: "pieces", label: "Number of pieces", type: "number", group: "Features" },
  ],
};

/** Category-specific fields + the common ones, for a given category slug (unknown categories get only the common fields). */
export function specFieldsFor(categorySlug: string | undefined): SpecField[] {
  const specific = (categorySlug && SPEC_TEMPLATES[categorySlug]) || [];
  return [...specific, ...COMMON_SPEC_FIELDS];
}

/** Builds a zod schema for `specs` from a category's template: unknown keys are
 * dropped, values are typed and coerced, text is cleaned. Used server side so a
 * product can never end up with specs that don't belong to its category. */
export function parseSpecs(categorySlug: string | undefined, input: unknown): Record<string, string | number | boolean | string[]> {
  const fields = specFieldsFor(categorySlug);
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Record<string, string | number | boolean | string[]> = {};
  for (const f of fields) {
    const v = raw[f.key];
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "number") {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0 && n <= 1_000_000) out[f.key] = n;
    } else if (f.type === "boolean") {
      if (typeof v === "boolean") out[f.key] = v;
    } else if (f.type === "select") {
      const s = clean(String(v)).slice(0, 60);
      if (f.options?.includes(s)) out[f.key] = s;
    } else if (f.type === "multiselect") {
      const arr = Array.isArray(v) ? v : [];
      const cleaned = arr.map((x) => clean(String(x)).slice(0, 60)).filter((s) => f.options?.includes(s));
      if (cleaned.length) out[f.key] = Array.from(new Set(cleaned)).slice(0, 20);
    } else {
      const s = clean(String(v)).slice(0, 300);
      if (s) out[f.key] = s;
    }
  }
  return out;
}

/** Extracts and validates spec filter values from (untrusted) URL search params
 * against a category's filterable spec fields -- unknown keys are ignored and a
 * value that isn't one of the field's options (for select) or a plain integer
 * (for number) is dropped, so only whitelisted key/value pairs ever reach the
 * database query. */
export function parseSpecFilters(categorySlug: string | undefined, sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of specFieldsFor(categorySlug)) {
    if (!f.filterable) continue;
    const raw = sp[f.key];
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (!v) continue;
    if (f.type === "select" && f.options?.includes(v)) out[f.key] = v;
    else if (f.type === "number" && /^\d+$/.test(v)) out[f.key] = v;
  }
  return out;
}

/** Formats a stored spec value for display on the product page. */
export function formatSpecValue(field: SpecField, value: string | number | boolean | string[]): string {
  if (field.type === "boolean") return value ? "Yes" : "No";
  if (field.type === "multiselect" && Array.isArray(value)) return value.join(", ");
  if (field.type === "number" && field.unit) return `${value} ${field.unit}`;
  return String(value);
}

export const ASSEMBLY_OPTIONS = [
  { value: "not_required", label: "Not required" },
  { value: "required", label: "Assembly required" },
  { value: "free_installation", label: "Free installation" },
] as const;

/** Maps "teak", "Teak Wood" and "teak wood" all to the one canonical spelling
 * ("Teak wood"), so filters stay clean; an unrecognised value is kept but
 * Title-cased, so admin-entered custom materials still look intentional. */
export function canonicalizeMaterial(input: string): string {
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (!cleaned) return cleaned;
  const target = normalizeForMatch(cleaned);
  const match = ALL_MATERIALS.find((m) => normalizeForMatch(m) === target);
  return match ?? toTitleCase(cleaned);
}
