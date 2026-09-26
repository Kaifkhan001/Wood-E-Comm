import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add product" };

export default async function NewProduct() {
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position));
  return (
    <>
      <PageHeader title="Add product" />
      <ProductForm id={null} categories={cats} initial={{ name: "", slug: "", shortDescription: "", description: "", categoryId: "", price: "", mrp: "", material: "", color: "", dimensions: "", stock: "0", isActive: true, isFeatured: false, images: [] }} />
    </>
  );
}
