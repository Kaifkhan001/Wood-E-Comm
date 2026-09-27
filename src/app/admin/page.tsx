import Link from "next/link";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, leads, orders, products, projects, quoteRequests } from "@/db/schema";
import { Card, PageHeader, StatusPill, Table } from "@/components/admin/ui";
import { formatDate, formatINR, orderNumber } from "@/lib/utils";
import { SalesChart } from "@/components/admin/sales-chart";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const SOLD = ["confirmed", "in_production", "shipped", "delivered"] as const;

export default async function Dashboard() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const since = new Date(Date.now() - 29 * 86_400_000);
  since.setHours(0, 0, 0, 0);

  const [[revenue], [pendingOrders], [newQuotes], [openMsgs], [leadCount], [projectCount], recent, lowStock, daily] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(${orders.subtotal}),0)::int`, n: count() }).from(orders).where(and(inArray(orders.status, [...SOLD]), gte(orders.createdAt, monthStart))),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "requested")),
    db.select({ n: count() }).from(quoteRequests).where(eq(quoteRequests.status, "new")),
    db.select({ n: count() }).from(contactMessages).where(eq(contactMessages.isResolved, false)),
    db.select({ n: count() }).from(leads),
    db.select({ total: count(), published: sql<number>`count(*) filter (where ${projects.isPublished})::int` }).from(projects),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.select({ id: products.id, name: products.name, stock: products.stock }).from(products).where(and(eq(products.isActive, true), lte(products.stock, 3))).orderBy(products.stock).limit(6),
    db
      .select({ day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`, total: sql<number>`coalesce(sum(${orders.subtotal}),0)::int` })
      .from(orders)
      .where(and(inArray(orders.status, [...SOLD]), gte(orders.createdAt, since)))
      .groupBy(sql`1`),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, d.total]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    return { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: byDay.get(key) ?? 0 };
  });

  const stats = [
    { label: "Confirmed sales this month", value: formatINR(revenue.v), sub: `${revenue.n} orders`, href: "/admin/orders" },
    { label: "Orders to confirm", value: pendingOrders.n, sub: "Call these customers", href: "/admin/orders?status=requested" },
    { label: "New interior quotes", value: newQuotes.n, sub: "Assign a designer", href: "/admin/quotes?status=new" },
    { label: "Open messages", value: openMsgs.n, sub: `${leadCount.n} offer sign-ups`, href: "/admin/messages" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg border border-line bg-white p-5 transition-colors hover:border-bottle">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 font-display text-[34px] leading-none tabular-nums">{s.value}</p>
            <p className="mt-2 text-sm text-muted">{s.sub}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-sans text-base font-semibold">Confirmed sales, last 30 days</h2>
        <SalesChart data={series} />
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-base font-semibold">Recent orders</h2><Link href="/admin/orders" className="text-sm underline underline-offset-4">All orders</Link></div>
          <Table>
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">{orderNumber(o.number)}</Link></td>
                  <td>{o.customerName}<br /><span className="text-muted">{o.city}</span></td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td className="tabular-nums">{formatINR(o.subtotal)}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={5} className="text-center text-muted">No orders yet</td></tr>}
            </tbody>
          </Table>
        </section>
        <section>
          <h2 className="mb-3 font-sans text-base font-semibold">Running low on stock</h2>
          <Card>
            {lowStock.length ? (
              <ul className="divide-y divide-line text-sm">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 py-2.5"><Link href={`/admin/products/${p.id}`} className="hover:underline">{p.name}</Link><span className={p.stock === 0 ? "font-medium text-danger" : "text-muted"}>{p.stock} left</span></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Everything is well stocked.</p>}
          </Card>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-sans text-base font-semibold">Projects</h2><Link href="/admin/projects" className="text-sm underline underline-offset-4">All projects</Link></div>
          <Card>
            <p className="text-sm text-muted">{projectCount.published} published of {projectCount.total} total</p>
          </Card>
        </section>
      </div>
    </>
  );
}
