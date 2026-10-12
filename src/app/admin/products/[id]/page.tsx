import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, productImages, products, subcategories } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [p, cats, subcats] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, id), with: { images: { orderBy: [asc(productImages.position)] } } }),
    db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).orderBy(asc(categories.position)),
    db.select({ id: subcategories.id, categoryId: subcategories.categoryId, name: subcategories.name, slug: subcategories.slug }).from(subcategories).orderBy(asc(subcategories.position)),
  ]);
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.name} />
      <ProductForm
        id={p.id}
        categories={cats}
        subcategories={subcats}
        initial={{
          name: p.name, slug: p.slug, shortDescription: p.shortDescription, description: p.description, categoryId: p.categoryId, subcategoryId: p.subcategoryId ?? "",
          price: String(p.price), mrp: p.mrp ? String(p.mrp) : "", material: p.material, color: p.color, dimensions: p.dimensions,
          stock: String(p.stock), isActive: p.isActive, isFeatured: p.isFeatured,
          images: p.images.map((i) => ({ publicId: i.publicId, url: i.url, alt: i.alt, fit: i.fit === "cover" ? "cover" as const : "contain" as const })),
          brand: p.brand ?? "", sku: p.sku ?? "", widthCm: p.widthCm ?? "", depthCm: p.depthCm ?? "", heightCm: p.heightCm ?? "", weightKg: p.weightKg ?? "",
          assembly: p.assembly ?? "", warrantyMonths: p.warrantyMonths ? String(p.warrantyMonths) : "", countryOfOrigin: p.countryOfOrigin ?? "",
          highlights: p.highlights, specs: p.specs,
        }}
      />
    </>
  );
}
