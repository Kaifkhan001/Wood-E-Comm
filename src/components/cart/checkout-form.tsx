"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { placeOrder } from "@/app/actions/public";
import { useActionForm } from "@/components/forms/use-form";
import { formatINR } from "@/lib/utils";
import { useCartDetails } from "./use-cart-details";

const STATES = ["Maharashtra", "Gujarat", "Goa", "Karnataka", "Delhi", "Telangana", "Tamil Nadu", "Madhya Pradesh", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala", "Other"];

export function CheckoutForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const { cart, rows, subtotal, loading } = useCartDetails();
  const { pending, error, fieldErrors, run } = useActionForm<{ orderId: string; number: string }>();
  const [f, setF] = useState({ customerName: defaultName, phone: "", addressLine1: "", addressLine2: "", city: "Mumbai", state: "Maharashtra", pincode: "", notes: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (loading) return <div className="skeleton mt-10 h-96" />;
  if (!rows.length) {
    return (
      <div className="mt-10 rounded-lg border border-dashed border-line px-6 py-16 text-center">
        <h2 className="text-2xl">Your cart is empty</h2>
        <Link href="/furniture" className="btn-primary mt-6">Browse furniture</Link>
      </div>
    );
  }

  const Err = ({ k }: { k: string }) => (fieldErrors[k] ? <p className="field-error">{fieldErrors[k]}</p> : null);

  return (
    <form
      noValidate
      className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await run(() => placeOrder({ ...f, items: rows.map((r) => ({ productId: r.id, quantity: r.quantity })) }));
        if (res.ok && res.data) {
          cart.clear();
          router.push(`/thank-you?type=order&order=${res.data.number}`);
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <h2 className="font-sans text-lg font-semibold sm:col-span-2">Delivery details</h2>
        <div><label htmlFor="o-name" className="label-text">Full name</label><input id="o-name" className="field" autoComplete="name" value={f.customerName} onChange={set("customerName")} /><Err k="customerName" /></div>
        <div><label htmlFor="o-phone" className="label-text">Mobile number</label><input id="o-phone" className="field" inputMode="numeric" autoComplete="tel-national" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} /><Err k="phone" /></div>
        <div className="sm:col-span-2"><label htmlFor="o-a1" className="label-text">Flat, building, street</label><input id="o-a1" className="field" autoComplete="address-line1" value={f.addressLine1} onChange={set("addressLine1")} /><Err k="addressLine1" /></div>
        <div className="sm:col-span-2"><label htmlFor="o-a2" className="label-text">Area and landmark <span className="font-normal text-muted">(optional)</span></label><input id="o-a2" className="field" autoComplete="address-line2" value={f.addressLine2} onChange={set("addressLine2")} /></div>
        <div><label htmlFor="o-city" className="label-text">City</label><input id="o-city" className="field" autoComplete="address-level2" value={f.city} onChange={set("city")} /><Err k="city" /></div>
        <div><label htmlFor="o-pin" className="label-text">PIN code</label><input id="o-pin" className="field" inputMode="numeric" autoComplete="postal-code" value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} /><Err k="pincode" /></div>
        <div><label htmlFor="o-state" className="label-text">State</label><select id="o-state" className="field" value={f.state} onChange={set("state")}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="sm:col-span-2"><label htmlFor="o-notes" className="label-text">Notes for delivery <span className="font-normal text-muted">(optional)</span></label><textarea id="o-notes" rows={3} className="field" maxLength={500} value={f.notes} onChange={set("notes")} placeholder="Lift access, preferred time, floor number…" /></div>
      </div>

      <aside className="h-fit rounded-lg bg-paper p-6 lg:sticky lg:top-28">
        <h2 className="font-sans text-lg font-semibold">Your order</h2>
        <ul className="mt-4 space-y-3 text-[15px]">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-3"><span className="min-w-0 break-words">{r.name} × {r.quantity}</span><span className="shrink-0 tabular-nums">{formatINR(r.price * r.quantity)}</span></li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-semibold"><span>Estimated total</span><span className="tabular-nums">{formatINR(subtotal)}</span></div>
        <p className="mt-3 text-sm leading-relaxed text-muted">No payment now. We&apos;ll call you to confirm delivery and share payment options. Final prices are checked on our side.</p>
        {error && <p role="alert" className="field-error mt-4">{error}</p>}
        <button type="submit" className="btn-primary mt-6 w-full" disabled={pending}>{pending ? "Placing request…" : "Place order request"}</button>
        <p className="mt-3 text-center text-xs text-muted">By placing this request you agree to our <Link href="/terms" className="underline">terms</Link>.</p>
      </aside>
    </form>
  );
}
