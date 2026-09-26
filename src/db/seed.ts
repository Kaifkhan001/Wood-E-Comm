/* Demo data. Run: npm run db:seed  (safe to re-run: clears catalogue + projects first) */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const u = (id: string, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const IMG = {
  sofa: ["photo-1555041469-a586c61ea9bc", "photo-1493663284031-b7e3aefcae8e", "photo-1540574163026-643ea20ade25", "photo-1567016432779-094069958ea5"],
  bed: ["photo-1505693416388-ac5ce068fe85", "photo-1615874959474-d609969a20ed", "photo-1522771739844-6a9f6d5f14af", "photo-1540518614846-7eded433c457"],
  dining: ["photo-1617806118233-18e1de247200", "photo-1604578762246-41134e37f9cc", "photo-1595515106969-1ce29566ff1c"],
  chair: ["photo-1567538096630-e0c55bd6374c", "photo-1592078615290-033ee584e267", "photo-1506439773649-6e0eb8cfb237", "photo-1581539250439-c96689b516dd", "photo-1538688525198-9b88f6f53126"],
  storage: ["photo-1558997519-83ea9252edf8", "photo-1618220179428-22790b461013", "photo-1595428774223-ef52624120d2"],
  table: ["photo-1532372320572-cda25653a26d", "photo-1533090481720-856c6e3c1fdc", "photo-1503602642458-232111445657"],
  interior: [
    "photo-1586023492125-27b2c045efd7",
    "photo-1616486338812-3dadae4b4ace",
    "photo-1618221195710-dd6b41faaea6",
    "photo-1600210492486-724fe5c67fb0",
    "photo-1600607687939-ce8a6c25118c",
    "photo-1600585154340-be6161a56a0c",
    "photo-1524758631624-e2822e304c36",
    "photo-1600566753190-17f0baa2a6c3",
    "photo-1560448204-e02f11c3d0e2",
    "photo-1502005229762-cf1b2da7c5d6",
  ],
};

const CATS = [
  { key: "sofa", name: "Sofas", slug: "sofas", description: "Three-seaters, L-shapes and loveseats in solid-wood frames with removable covers." },
  { key: "bed", name: "Beds", slug: "beds", description: "Queen and king beds, with and without hydraulic storage." },
  { key: "dining", name: "Dining", slug: "dining", description: "Four, six and eight seater dining sets for everyday meals and long Sunday lunches." },
  { key: "chair", name: "Chairs", slug: "chairs", description: "Lounge chairs, accent chairs and cane seating." },
  { key: "storage", name: "Storage", slug: "storage", description: "Wardrobes, sideboards, bookshelves and shoe racks." },
  { key: "table", name: "Tables", slug: "tables", description: "Coffee tables, side tables and study desks." },
] as const;

type P = [cat: (typeof CATS)[number]["key"], name: string, material: string, color: string, price: number, mrp: number | null, dims: string, stock: number, featured?: boolean];

const PRODUCTS: P[] = [
  ["sofa", "Kaveri three-seater sofa", "Sheesham wood", "Olive", 42999, 54999, "W 198 × D 86 × H 82 cm", 12, true],
  ["sofa", "Juhu L-shaped sofa", "Teak wood", "Oat", 78999, 92999, "W 262 × D 165 × H 84 cm", 5, true],
  ["sofa", "Malabar loveseat", "Mango wood", "Rust", 28499, 33999, "W 142 × D 82 × H 80 cm", 9],
  ["sofa", "Nilgiri sofa cum bed", "Engineered wood", "Charcoal", 31999, null, "W 190 × D 90 × H 85 cm", 0],
  ["bed", "Deccan king bed with storage", "Sheesham wood", "Walnut", 56999, 69999, "L 210 × W 190 × H 105 cm", 7, true],
  ["bed", "Konkan queen bed", "Mango wood", "Natural", 38999, 45999, "L 208 × W 165 × H 98 cm", 10],
  ["bed", "Sahyadri upholstered bed", "Engineered wood", "Sand", 44999, 52999, "L 212 × W 170 × H 120 cm", 4],
  ["bed", "Chettinad cane bed", "Cane & rattan", "Honey", 61999, null, "L 210 × W 185 × H 110 cm", 3, true],
  ["dining", "Pali six-seater dining set", "Sheesham wood", "Walnut", 64999, 79999, "Table L 180 × W 90 cm", 6, true],
  ["dining", "Coorg four-seater dining set", "Mango wood", "Natural", 34999, 41999, "Table L 120 × W 80 cm", 11],
  ["dining", "Marine Drive round dining table", "Teak wood", "Teak", 39999, null, "Ø 110 × H 76 cm", 5],
  ["chair", "Varli cane lounge chair", "Cane & rattan", "Honey", 18999, 22999, "W 72 × D 78 × H 80 cm", 14, true],
  ["chair", "Bandra accent chair", "Teak wood", "Mustard", 16499, 19999, "W 68 × D 72 × H 84 cm", 8],
  ["chair", "Colaba rocking chair", "Sheesham wood", "Walnut", 21999, null, "W 64 × D 95 × H 92 cm", 6],
  ["chair", "Set of two Parel dining chairs", "Mango wood", "Natural", 12999, 15999, "W 46 × D 52 × H 88 cm", 20],
  ["storage", "Kutch three-door wardrobe", "Sheesham wood", "Walnut", 72999, 84999, "W 150 × D 58 × H 200 cm", 4, true],
  ["storage", "Hampi sideboard", "Mango wood", "Natural", 32999, 38999, "W 150 × D 42 × H 80 cm", 9],
  ["storage", "Matheran bookshelf", "Engineered wood", "Oak", 14999, 17999, "W 90 × D 32 × H 180 cm", 16],
  ["storage", "Worli shoe cabinet", "Engineered wood", "White", 9999, 12499, "W 80 × D 35 × H 100 cm", 0],
  ["table", "Lonavala coffee table", "Sheesham wood", "Walnut", 15999, 19999, "W 110 × D 60 × H 42 cm", 18, true],
  ["table", "Alibaug nesting side tables", "Mango wood", "Natural", 8999, 10999, "Ø 45 / Ø 35 cm", 22],
  ["table", "Powai study desk", "Engineered wood", "Oak", 13499, 15999, "W 120 × D 60 × H 75 cm", 12],
  ["table", "Goa cane coffee table", "Cane & rattan", "Honey", 17499, null, "Ø 80 × H 40 cm", 7],
];

const PROJECTS = [
  { title: "A calm 2 BHK in Andheri West", location: "Andheri West, Mumbai", homeType: "2 BHK", style: "Warm minimal", areaSqft: 780, durationWeeks: 9, img: [0, 1, 2] },
  { title: "Teak and terrazzo in Powai", location: "Powai, Mumbai", homeType: "3 BHK", style: "Modern Indian", areaSqft: 1250, durationWeeks: 12, img: [3, 4, 5] },
  { title: "A compact 1 BHK made to feel bigger", location: "Thane West", homeType: "1 BHK", style: "Scandinavian", areaSqft: 520, durationWeeks: 6, img: [6, 7, 8] },
  { title: "Sea-facing family home in Bandra", location: "Bandra West, Mumbai", homeType: "4 BHK", style: "Contemporary", areaSqft: 2100, durationWeeks: 16, img: [9, 0, 3] },
  { title: "Garden villa in Lonavala", location: "Lonavala", homeType: "Villa", style: "Tropical modern", areaSqft: 3200, durationWeeks: 20, img: [5, 2, 7] },
  { title: "Founder's office in Lower Parel", location: "Lower Parel, Mumbai", homeType: "Office", style: "Workspace", areaSqft: 1800, durationWeeks: 10, img: [8, 4, 1] },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-");

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  await db.delete(schema.productImages);
  await db.delete(schema.orderItems);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.projects);

  const cats = await db
    .insert(schema.categories)
    .values(CATS.map((c, i) => ({ name: c.name, slug: c.slug, description: c.description, imageUrl: u(IMG[c.key][0], 800), position: i })))
    .returning();
  const catId = Object.fromEntries(CATS.map((c, i) => [c.key, cats[i].id]));

  for (const [i, [cat, name, material, color, price, mrp, dims, stock, featured]] of PRODUCTS.entries()) {
    const [p] = await db
      .insert(schema.products)
      .values({
        name,
        slug: slugify(name),
        categoryId: catId[cat],
        material,
        color,
        price,
        mrp,
        dimensions: dims,
        stock,
        isFeatured: Boolean(featured),
        shortDescription: `${material} ${CATS.find((c) => c.key === cat)!.name.toLowerCase().replace(/s$/, "")} in a ${color.toLowerCase()} finish.`,
        description:
          `Built by our workshop in Jodhpur from seasoned ${material.toLowerCase()}, with joinery that holds up to daily use for years.\n\n` +
          `The ${color.toLowerCase()} finish is food-safe and hand-rubbed in three coats. Every piece is checked twice before it leaves the workshop.\n\n` +
          `Free delivery and installation in Mumbai, Pune and Thane. Delivery elsewhere in India is quoted at checkout confirmation.`,
        createdAt: new Date(Date.now() - i * 86_400_000),
      })
      .returning();
    const pool = IMG[cat];
    await db.insert(schema.productImages).values([
      { productId: p.id, url: u(pool[i % pool.length]), alt: name, position: 0 },
      { productId: p.id, url: u(pool[(i + 1) % pool.length]), alt: `${name}, another view`, position: 1 },
    ]);
  }

  await db.insert(schema.projects).values(
    PROJECTS.map((p, i) => ({
      title: p.title,
      slug: slugify(p.title),
      location: p.location,
      homeType: p.homeType,
      style: p.style,
      areaSqft: p.areaSqft,
      durationWeeks: p.durationWeeks,
      summary: `A ${p.homeType.toLowerCase()} in ${p.location.split(",")[0]} designed around how the family actually lives: more storage where it's needed, light where it matters, and materials that age well. Designed, built and handed over in ${p.durationWeeks} weeks.`,
      coverUrl: u(IMG.interior[p.img[0]], 1600),
      gallery: p.img.map((k) => u(IMG.interior[k], 1600)),
      position: i,
    })),
  );

  console.log(`Seeded ${cats.length} categories, ${PRODUCTS.length} products, ${PROJECTS.length} projects.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
