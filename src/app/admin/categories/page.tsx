import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const [rows, subRows] = await Promise.all([
    db
      .select({
        id: categories.id, name: categories.name, slug: categories.slug, description: categories.description,
        imageUrl: categories.imageUrl, position: categories.position, count: count(products.id),
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.position), asc(categories.name)),
    db
      .select({
        id: subcategories.id, categoryId: subcategories.categoryId, name: subcategories.name, slug: subcategories.slug,
        position: subcategories.position, count: count(products.id),
      })
      .from(subcategories)
      .leftJoin(products, eq(products.subcategoryId, subcategories.id))
      .groupBy(subcategories.id)
      .orderBy(asc(subcategories.position), asc(subcategories.name)),
  ]);
  return (
    <>
      <PageHeader title="Categories" />
      <CategoryManager items={rows} subcategories={subRows} />
    </>
  );
}
