import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, quoteRequests } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { pageMeta } from "@/lib/seo";
import { formatDate, formatINR, orderNumber } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata = pageMeta({ title: "Your account", description: "Your orders and quotes.", path: "/account", noindex: true });

const ORDER_LABEL: Record<string, string> = {
  requested: "Awaiting confirmation", confirmed: "Confirmed", in_production: "Being made", shipped: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};
const QUOTE_LABEL: Record<string, string> = { new: "Received", contacted: "Designer assigned", site_visit: "Site visit scheduled", quoted: "Quote shared", won: "Project started", lost: "Closed" };

export default async function AccountPage() {
  const session = await requireUser("/account");
  // Data isolation: every query is scoped to the verified session user id.
  const [myOrders, myQuotes] = await Promise.all([
    db.query.orders.findMany({ where: eq(orders.userId, session.user.id), orderBy: [desc(orders.createdAt)], with: { items: true }, limit: 50 }),
    db.select().from(quoteRequests).where(eq(quoteRequests.userId, session.user.id)).orderBy(desc(quoteRequests.createdAt)).limit(20),
  ]);

  return (
    <div className="container-x pt-10 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-tight sm:text-[52px]">Hello, {session.user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">{session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-12" aria-labelledby="orders-h">
        <h2 id="orders-h" className="text-3xl">Your orders</h2>
        {myOrders.length === 0 ? (
          <p className="mt-4 text-muted">No orders yet. <Link href="/furniture" className="text-ink underline underline-offset-4">Browse furniture</Link></p>
        ) : (
          <ul className="mt-6 space-y-4">
            {myOrders.map((o) => (
              <li key={o.id} className="rounded-lg border border-line bg-paper p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold tabular-nums">{orderNumber(o.number)}</p>
                  <span className="rounded-full bg-cane/50 px-3 py-1 text-sm">{ORDER_LABEL[o.status]}</span>
                </div>
                <p className="mt-1 text-sm text-muted">Placed {formatDate(o.createdAt)}</p>
                <ul className="mt-3 text-[15px]">{o.items.map((it) => <li key={it.id}>{it.productName} × {it.quantity}</li>)}</ul>
                <p className="mt-3 font-medium tabular-nums">{formatINR(o.subtotal)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="quotes-h">
        <h2 id="quotes-h" className="text-3xl">Your interior quotes</h2>
        {myQuotes.length === 0 ? (
          <p className="mt-4 text-muted">No quote requests yet. <Link href="/get-a-quote" className="text-ink underline underline-offset-4">Get a free quote</Link></p>
        ) : (
          <ul className="mt-6 space-y-4">
            {myQuotes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper p-5">
                <div><p className="font-medium">{q.homeSize} {q.propertyType.toLowerCase()} in {q.city}</p><p className="text-sm text-muted">{q.scope.join(", ")}, requested {formatDate(q.createdAt)}</p></div>
                <span className="rounded-full bg-cane/50 px-3 py-1 text-sm">{QUOTE_LABEL[q.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
