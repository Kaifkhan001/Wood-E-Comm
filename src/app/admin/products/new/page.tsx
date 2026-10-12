import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add product" };

export default async function NewProduct() {
  const [cats, subcats] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).orderBy(asc(categories.position)),
    db.select({ id: subcategories.id, categoryId: subcategories.categoryId, name: subcategories.name, slug: subcategories.slug }).from(subcategories).orderBy(asc(subcategories.position)),
  ]);
  return (
    <>
      <PageHeader title="Add product" />
      <ProductForm
        id={null}
        categories={cats}
        subcategories={subcats}
        initial={{
          name: "", slug: "", shortDescription: "", description: "", categoryId: "", subcategoryId: "", price: "", mrp: "", material: "", color: "", dimensions: "", stock: "0", isActive: true, isFeatured: false, images: [],
          brand: "", sku: "", widthCm: "", depthCm: "", heightCm: "", weightKg: "", assembly: "", warrantyMonths: "", countryOfOrigin: "", highlights: [], specs: {},
        }}
      />
    </>
  );
}
