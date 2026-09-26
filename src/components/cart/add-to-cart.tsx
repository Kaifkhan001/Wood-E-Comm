"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./cart-context";

export function AddToCart({ productId, name, inStock }: { productId: string; name: string; inStock: boolean }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return <p className="rounded-md bg-cane/40 px-4 py-3 text-sm text-sheesham">Out of stock. Message us on WhatsApp and we&apos;ll tell you when it&apos;s back.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-full border border-line bg-paper" role="group" aria-label="Quantity">
        <button type="button" className="flex h-11 w-11 items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center tabular-nums" aria-live="polite">{qty}</span>
        <button type="button" className="flex h-11 w-11 items-center justify-center" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        className="btn-primary flex-1 sm:flex-none"
        onClick={() => {
          add(productId, qty);
          setAdded(true);
          toast.success(`${name} added to your cart`, { action: { label: "View cart", onClick: () => (window.location.href = "/cart") } });
          setTimeout(() => setAdded(false), 1800);
        }}
      >
        {added ? <><Check className="h-4 w-4" /> Added</> : "Add to cart"}
      </button>
      <Link href="/cart" className="text-sm underline underline-offset-4 hover:text-bottle">Go to cart</Link>
    </div>
  );
}
