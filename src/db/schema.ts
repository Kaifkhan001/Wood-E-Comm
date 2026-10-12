import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ───────────────────────── Auth (Better Auth) ───────────────────────── */

export const roleEnum = pgEnum("role", ["customer", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  // role is never accepted from client input (see auth.ts: input: false)
  role: roleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ───────────────────────── Catalogue ───────────────────────── */

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin-managed subcategories within a category (e.g. "3 Seater Sofas" under
// "Sofas"). A product's subcategory is optional, and deleting one just clears
// it from any products that used it rather than touching the products.
export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subcategories_category_slug_idx").on(t.categoryId, t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
    // Prices are whole rupees. Keep integer to avoid float errors.
    price: integer("price").notNull(),
    mrp: integer("mrp"),
    material: text("material").notNull(),
    color: text("color").notNull().default(""),
    dimensions: text("dimensions").notNull().default(""),
    stock: integer("stock").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    // Amazon-style specifications, all optional -- existing products keep working
    // unchanged. widthCm/depthCm/heightCm are shown instead of the free-text
    // `dimensions` column when set; `dimensions` is kept as the fallback.
    brand: text("brand"),
    sku: text("sku"),
    widthCm: numeric("width_cm", { precision: 7, scale: 1 }),
    depthCm: numeric("depth_cm", { precision: 7, scale: 1 }),
    heightCm: numeric("height_cm", { precision: 7, scale: 1 }),
    weightKg: numeric("weight_kg", { precision: 7, scale: 1 }),
    assembly: text("assembly"), // "not_required" | "required" | "free_installation"
    warrantyMonths: integer("warranty_months"),
    countryOfOrigin: text("country_of_origin"),
    highlights: jsonb("highlights").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    specs: jsonb("specs").$type<Record<string, string | number | boolean | string[]>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_subcategory_idx").on(t.subcategoryId),
    index("products_active_price_idx").on(t.isActive, t.price),
    index("products_material_idx").on(t.material),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_specs_gin_idx").using("gin", t.specs),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Either a Cloudinary public_id (preferred) or an absolute https URL (seed/stock images)
    publicId: text("public_id"),
    url: text("url"),
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
    // "contain" shows the whole product, padded (right for studio/cutout photos on a
    // plain background); "cover" fills the frame (right for lifestyle/room photos).
    fit: text("fit").notNull().default("contain"),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

// When a product's (or project's) slug is edited, the old slug moves here so the
// old URL keeps working: the product page 308-redirects to the new one instead of
// 404ing. A product can be deleted entirely (cascade); a slug freed by one product
// being renamed again points redirects at the LATEST slug, never a chain.
export const productSlugRedirects = pgTable("product_slug_redirects", {
  oldSlug: text("old_slug").primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ───────────────────────── Orders (order requests) ───────────────────────── */

export const orderStatusEnum = pgEnum("order_status", [
  "requested",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: serial("number").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("requested"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2").notNull().default(""),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    notes: text("notes").notNull().default(""),
    subtotal: integer("subtotal").notNull(),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_status_idx").on(t.status)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  // Snapshots, so later product edits never rewrite order history
  productName: text("product_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

/* ───────────────────────── Interior design ───────────────────────── */

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  location: text("location").notNull(),
  homeType: text("home_type").notNull(), // e.g. "2 BHK", "Villa", "Office"
  style: text("style").notNull(),
  areaSqft: integer("area_sqft"),
  durationWeeks: integer("duration_weeks"),
  summary: text("summary").notNull(),
  coverUrl: text("cover_url").notNull(),
  gallery: jsonb("gallery").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isPublished: boolean("is_published").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectSlugRedirects = pgTable("project_slug_redirects", {
  oldSlug: text("old_slug").primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quoteStatusEnum = pgEnum("quote_status", [
  "new",
  "contacted",
  "site_visit",
  "quoted",
  "won",
  "lost",
]);

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    city: text("city").notNull(),
    propertyType: text("property_type").notNull(),
    homeSize: text("home_size").notNull(),
    scope: jsonb("scope").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    budget: text("budget").notNull(),
    timeline: text("timeline").notNull(),
    message: text("message").notNull().default(""),
    status: quoteStatusEnum("status").notNull().default("new"),
    adminNotes: text("admin_notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("quotes_status_idx").on(t.status)],
);

/* ───────────────────────── Enquiries & leads ───────────────────────── */

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  message: text("message").notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    source: text("source").notNull().default("discount_popup"),
    consent: boolean("consent").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("leads_phone_source_idx").on(t.phone, t.source)],
);

/* ───────────────────────── Relations ───────────────────────── */

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  subcategories: many(subcategories),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, { fields: [subcategories.categoryId], references: [categories.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  subcategory: one(subcategories, { fields: [products.subcategoryId], references: [subcategories.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(user, { fields: [orders.userId], references: [user.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
