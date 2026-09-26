import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [p, cats] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, id), with: { images: { orderBy: [asc(productImages.position)] } } }),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position)),
  ]);
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.name} />
      <ProductForm
        id={p.id}
        categories={cats}
        initial={{
          name: p.name, slug: p.slug, shortDescription: p.shortDescription, description: p.description, categoryId: p.categoryId,
          price: String(p.price), mrp: p.mrp ? String(p.mrp) : "", material: p.material, color: p.color, dimensions: p.dimensions,
          stock: String(p.stock), isActive: p.isActive, isFeatured: p.isFeatured,
          images: p.images.map((i) => ({ publicId: i.publicId, url: i.url, alt: i.alt })),
        }}
      />
    </>
  );
}
