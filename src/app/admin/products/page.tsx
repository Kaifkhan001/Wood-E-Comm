import Link from "next/link";
import { and, asc, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products } from "@/db/schema";
import { CardList, CardRow, Empty, PageHeader, Table } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { AdminImageThumb } from "@/components/admin/image-thumb";
import { imageSrc } from "@/lib/images";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const cat = typeof sp.category === "string" && /^[0-9a-f-]{36}$/.test(sp.category) ? sp.category : "";
  const conds: SQL[] = [];
  if (q) conds.push(ilike(products.name, `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`));
  if (cat) conds.push(eq(products.categoryId, cat));

  const [cats, rows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position)),
    db.query.products.findMany({
      where: conds.length ? and(...conds) : undefined,
      orderBy: [desc(products.updatedAt)],
      limit: 200,
      with: { images: { orderBy: [asc(productImages.position)], limit: 1 }, category: { columns: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Products"><Link href="/admin/products/new" className="btn-primary">Add product</Link></PageHeader>
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search by name" className="field max-w-xs bg-white" aria-label="Search products" />
        <select name="category" defaultValue={cat} className="field w-auto bg-white" aria-label="Category">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-outline">Filter</button>
      </form>
      {rows.length === 0 ? (
        <Empty>No products found. <Link href="/admin/products/new" className="text-ink underline">Add your first product</Link>.</Empty>
      ) : (
        <>
          <CardList className="md:hidden">
            {rows.map((p) => (
              <li key={p.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-sm bg-cane/30">
                    {p.images[0] && <AdminImageThumb src={imageSrc(p.images[0], 120)} sizes="48px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                    {p.isFeatured && <span className="ml-2 text-xs text-brass">Featured</span>}
                    <p className="text-sm text-muted">{p.category.name} · {p.material}</p>
                    <p className="mt-0.5 text-sm">
                      <span className="tabular-nums">{formatINR(p.price)}</span>
                      {" · "}
                      <span className={p.stock === 0 ? "font-medium text-danger" : "text-muted"}>{p.stock} in stock</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <ProductRowActions id={p.id} slug={p.slug} isActive={p.isActive} name={p.name} />
                </div>
              </li>
            ))}
          </CardList>
          <Table className="hidden md:block">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Visible</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-sm bg-cane/30">
                        {p.images[0] && <AdminImageThumb src={imageSrc(p.images[0], 120)} sizes="40px" className="object-cover" />}
                      </div>
                      <div><Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>{p.isFeatured && <span className="ml-2 text-xs text-brass">Featured</span>}<p className="text-muted">{p.material}</p></div>
                    </div>
                  </td>
                  <td>{p.category.name}</td>
                  <td className="tabular-nums">{formatINR(p.price)}</td>
                  <td className={p.stock === 0 ? "font-medium text-danger" : ""}>{p.stock}</td>
                  <td colSpan={2}><ProductRowActions id={p.id} slug={p.slug} isActive={p.isActive} name={p.name} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}
