"use client";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { imageSrc } from "@/lib/images";
import { formatINR } from "@/lib/utils";
import { useCartDetails } from "./use-cart-details";

export function CartView() {
  const { cart, rows, subtotal, loading } = useCartDetails();

  if (loading) {
    return (
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]" aria-busy="true">
        <div className="space-y-6">{[0, 1].map((i) => <div key={i} className="flex gap-4"><div className="skeleton h-28 w-24" /><div className="flex-1 space-y-2"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-1/4" /></div></div>)}</div>
        <div className="skeleton h-56" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-line px-6 py-16 text-center">
        <h2 className="text-2xl">Your cart is empty</h2>
        <p className="mt-2 text-muted">Add a few pieces and they&apos;ll wait here for you.</p>
        <Link href="/furniture" className="btn-primary mt-6">Browse furniture</Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <ul className="divide-y divide-line border-y border-line">
        {rows.map((r) => (
          <li key={r.id} className="flex gap-4 py-5">
            <Link href={`/product/${r.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-cane/30">
              {r.images[0] && <SmartImage src={imageSrc(r.images[0], 300)} alt={r.name} fill sizes="96px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row">
              <div className="min-w-0">
                <Link href={`/product/${r.slug}`} className="font-medium break-words hover:text-bottle">{r.name}</Link>
                <p className="mt-1 text-sm text-muted tabular-nums">{formatINR(r.price)} each</p>
                {r.stock < r.quantity && <p className="mt-1 text-sm text-danger">Only {r.stock} in stock</p>}
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:flex-col sm:flex-nowrap sm:items-end">
                <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantity for ${r.name}`}>
                  <button type="button" className="flex h-10 w-10 items-center justify-center" onClick={() => cart.setQty(r.id, r.quantity - 1)} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                  <span className="w-6 text-center tabular-nums">{r.quantity}</span>
                  <button type="button" className="flex h-10 w-10 items-center justify-center" onClick={() => cart.setQty(r.id, r.quantity + 1)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
                </div>
                <p className="font-semibold tabular-nums">{formatINR(r.price * r.quantity)}</p>
                <button type="button" onClick={() => cart.remove(r.id)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-danger" aria-label={`Remove ${r.name}`}>
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-lg bg-paper p-6 lg:sticky lg:top-28">
        <h2 className="font-sans text-lg font-semibold">Summary</h2>
        <dl className="mt-4 space-y-2 text-[15px]">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatINR(subtotal)}</dd></div>
          <div className="flex justify-between text-muted"><dt>Delivery</dt><dd>Confirmed by our team</dd></div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-semibold"><span>Estimated total</span><span className="tabular-nums">{formatINR(subtotal)}</span></div>
        <p className="mt-3 text-sm leading-relaxed text-muted">No payment now. Our team will call to confirm availability and delivery, then share payment options.</p>
        <Link href="/checkout" className="btn-primary mt-6 w-full">Continue to order request</Link>
      </aside>
    </div>
  );
}
