"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { productId: string; quantity: number };
type Ctx = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "ww_cart_v1";
const UUID = /^[0-9a-f-]{36}$/i;

// The cart only stores product IDs and quantities. Prices are always
// re-read from the database on the server, so tampering here changes nothing.
function parse(raw: string | null): CartLine[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    if (!Array.isArray(v)) return [];
    return v
      .filter((l) => l && typeof l.productId === "string" && UUID.test(l.productId))
      .map((l) => ({ productId: l.productId, quantity: Math.min(10, Math.max(1, Math.floor(Number(l.quantity) || 1))) }))
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(parse(localStorage.getItem(KEY)));
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(parse(e.newValue));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((productId: string, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === productId);
      if (found) return prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(10, l.quantity + qty) } : l));
      return [...prev, { productId, quantity: Math.min(10, qty) }].slice(0, 30);
    });
  }, []);
  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(10, Math.max(1, qty)) } : l)));
  }, []);
  const remove = useCallback((productId: string) => setLines((p) => p.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.quantity, 0), ready, add, setQty, remove, clear }),
    [lines, ready, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
