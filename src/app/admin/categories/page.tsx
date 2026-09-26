import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const rows = await db
    .select({
      id: categories.id, name: categories.name, slug: categories.slug, description: categories.description,
      imageUrl: categories.imageUrl, position: categories.position, count: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.position), asc(categories.name));
  return (
    <>
      <PageHeader title="Categories" />
      <CategoryManager items={rows} />
    </>
  );
}
