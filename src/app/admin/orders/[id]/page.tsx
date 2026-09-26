import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { StatusEditor } from "@/components/admin/status-editor";
import { formatDate, formatINR, orderNumber } from "@/lib/utils";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const o = await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } });
  if (!o) notFound();
  const num = orderNumber(o.number);
  const wa = `https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.customerName.split(" ")[0]}, this is Wood & Wonders about your order ${num}.`)}`;

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/orders" className="text-muted hover:underline">Orders</Link></p>
      <PageHeader title={num}><StatusPill status={o.status} /></PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="font-sans text-base font-semibold">Items</h2>
            <ul className="mt-3 divide-y divide-line text-[15px]">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4 py-3">
                  <span>{it.productId ? <Link href={`/admin/products/${it.productId}`} className="hover:underline">{it.productName}</Link> : it.productName} × {it.quantity}<br /><span className="text-sm text-muted">{formatINR(it.unitPrice)} each at time of order</span></span>
                  <span className="tabular-nums">{formatINR(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-line pt-3 font-semibold"><span>Subtotal</span><span className="tabular-nums">{formatINR(o.subtotal)}</span></p>
          </Card>
          <Card>
            <h2 className="font-sans text-base font-semibold">Customer</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[120px_1fr]">
              <dt className="text-muted">Name</dt><dd>{o.customerName}</dd>
              <dt className="text-muted">Phone</dt><dd><a href={`tel:+91${o.phone}`} className="underline">{o.phone}</a> <a href={wa} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#1f7a4d] underline">WhatsApp</a></dd>
              <dt className="text-muted">Email</dt><dd><a href={`mailto:${o.email}`} className="underline">{o.email}</a></dd>
              <dt className="text-muted">Address</dt><dd>{o.addressLine1}{o.addressLine2 && <><br />{o.addressLine2}</>}<br />{o.city}, {o.state} {o.pincode}</dd>
              <dt className="text-muted">Placed</dt><dd>{formatDate(o.createdAt)}</dd>
              {o.notes && <><dt className="text-muted">Notes</dt><dd className="whitespace-pre-line">{o.notes}</dd></>}
            </dl>
          </Card>
        </div>
        <Card className="h-fit">
          <StatusEditor kind="order" id={o.id} status={o.status} notes={o.adminNotes} statuses={orderStatusEnum.enumValues}
            hint="Confirming reserves stock. Cancelling a confirmed order puts it back." />
        </Card>
      </div>
    </>
  );
}
