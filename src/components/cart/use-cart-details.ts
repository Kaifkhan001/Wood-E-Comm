"use client";
import { useEffect, useState } from "react";
import { getCartDetails } from "@/app/actions/public";
import { useCart } from "./cart-context";

type Detail = Awaited<ReturnType<typeof getCartDetails>>[number];

export function useCartDetails() {
  const cart = useCart();
  const [details, setDetails] = useState<Detail[] | null>(null);
  const ids = cart.lines.map((l) => l.productId).sort().join(",");

  useEffect(() => {
    if (!cart.ready) return;
    let alive = true;
    if (!ids) { setDetails([]); return; }
    getCartDetails(ids.split(",")).then((d) => alive && setDetails(d)).catch(() => alive && setDetails([]));
    return () => { alive = false; };
  }, [ids, cart.ready]);

  // Drop lines for products that no longer exist or were deactivated
  useEffect(() => {
    if (!details) return;
    const live = new Set(details.map((d) => d.id));
    cart.lines.filter((l) => !live.has(l.productId)).forEach((l) => cart.remove(l.productId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  const rows = (details ?? [])
    .map((d) => ({ ...d, quantity: cart.lines.find((l) => l.productId === d.id)?.quantity ?? 0 }))
    .filter((r) => r.quantity > 0);
  const subtotal = rows.reduce((s, r) => s + r.price * r.quantity, 0);
  return { cart, rows, subtotal, loading: details === null };
}
