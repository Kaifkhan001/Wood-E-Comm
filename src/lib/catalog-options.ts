// Shared catalogue vocabulary: the admin product form and the storefront
// filters both read from here, so a material or spec option only needs to be
// defined once.

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
