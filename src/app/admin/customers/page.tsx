import Link from "next/link";
import { desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { account, orders, user } from "@/db/schema";
import { Empty, PageHeader, Table } from "@/components/admin/ui";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

const SOLD = ["confirmed", "in_production", "shipped", "delivered"] as const;

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const term = q ? `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%` : null;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      orderCount: sql<number>`count(distinct ${orders.id})::int`,
      confirmedTotal: sql<number>`coalesce(sum(case when ${inArray(orders.status, SOLD)} then ${orders.subtotal} else 0 end), 0)::int`,
      hasGoogle: sql<boolean>`bool_or(${account.providerId} = 'google')`,
    })
    .from(user)
    .leftJoin(orders, eq(orders.userId, user.id))
    .leftJoin(account, eq(account.userId, user.id))
    .where(term ? or(ilike(user.name, term), ilike(user.email, term)) : undefined)
    .groupBy(user.id)
    .orderBy(desc(user.createdAt))
    .limit(200);

  return (
    <>
      <PageHeader title="Customers" />
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Search by name or email" className="field max-w-xs bg-white" aria-label="Search customers" />
        <button className="btn-outline">Search</button>
      </form>
      {rows.length === 0 ? (
        <Empty>No customers {q ? `matching "${q}"` : "yet"}.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Customer</th><th>Joined</th><th>Sign-up</th><th>Orders</th><th>Confirmed total</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><p className="font-medium">{c.name}</p><p className="text-muted">{c.email}</p></td>
                <td>{formatDate(c.createdAt)}</td>
                <td>{c.hasGoogle ? "Google" : "Email"}</td>
                <td className="tabular-nums">
                  {c.orderCount > 0 ? <Link href={`/admin/orders?userId=${c.id}`} className="underline underline-offset-4 hover:no-underline">{c.orderCount}</Link> : 0}
                </td>
                <td className="tabular-nums">{formatINR(c.confirmedTotal)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
