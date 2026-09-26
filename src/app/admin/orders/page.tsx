import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { Empty, PageHeader, StatusPill, STATUS_LABEL, Table } from "@/components/admin/ui";
import { cn, formatDate, formatINR, orderNumber } from "@/lib/utils";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = orderStatusEnum.enumValues.find((s) => s === sp.status);
  const [rows, counts] = await Promise.all([
    db.select().from(orders).where(status ? eq(orders.status, status) : undefined).orderBy(desc(orders.createdAt)).limit(200),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  return (
    <>
      <PageHeader title="Orders" />
      <nav aria-label="Filter by status" className="-mx-1 mb-5 flex flex-wrap gap-1">
        <Link href="/admin/orders" className={cn("rounded-full px-3 py-1.5 text-sm", !status ? "bg-bottle text-paper" : "hover:bg-ink/5")}>All</Link>
        {orderStatusEnum.enumValues.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={cn("rounded-full px-3 py-1.5 text-sm", status === s ? "bg-bottle text-paper" : "hover:bg-ink/5")}>
            {STATUS_LABEL[s]} <span className="opacity-60">{byStatus[s] ?? 0}</span>
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <Empty>No orders {status ? `with status "${STATUS_LABEL[status]}"` : "yet"}.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Placed</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{orderNumber(o.number)}</Link></td>
                <td>{o.customerName}<br /><span className="text-muted">{o.city}, {o.pincode}</span></td>
                <td><a href={`tel:+91${o.phone}`} className="hover:underline">{o.phone}</a></td>
                <td>{formatDate(o.createdAt)}</td>
                <td className="tabular-nums">{formatINR(o.subtotal)}</td>
                <td><StatusPill status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
