import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { Empty, PageHeader, StatusPill, STATUS_LABEL, Table } from "@/components/admin/ui";
import { cn, formatDate, formatINR, orderNumber } from "@/lib/utils";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = orderStatusEnum.enumValues.find((s) => s === sp.status);
  const userId = typeof sp.userId === "string" && z.uuid().safeParse(sp.userId).success ? sp.userId : undefined;
  const filterQs = userId ? `&userId=${userId}` : "";
  const conds = [status ? eq(orders.status, status) : undefined, userId ? eq(orders.userId, userId) : undefined].filter(Boolean);
  const [rows, counts] = await Promise.all([
    db.select().from(orders).where(conds.length ? and(...conds) : undefined).orderBy(desc(orders.createdAt)).limit(200),
    db.select({ status: orders.status, n: count() }).from(orders).where(userId ? eq(orders.userId, userId) : undefined).groupBy(orders.status),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  return (
    <>
      <PageHeader title="Orders" />
      {userId && <p className="mb-4 text-sm text-muted">Showing orders for one customer. <Link href="/admin/orders" className="underline">Clear filter</Link></p>}
      <nav aria-label="Filter by status" className="-mx-1 mb-5 flex flex-wrap gap-1">
        <Link href={`/admin/orders?${new URLSearchParams(userId ? { userId } : {})}`} className={cn("rounded-full px-3 py-1.5 text-sm", !status ? "bg-bottle text-paper" : "hover:bg-ink/5")}>All</Link>
        {orderStatusEnum.enumValues.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}${filterQs}`} className={cn("rounded-full px-3 py-1.5 text-sm", status === s ? "bg-bottle text-paper" : "hover:bg-ink/5")}>
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
