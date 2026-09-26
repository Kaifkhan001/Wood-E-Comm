"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "./cart-context";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/5" aria-label={`Cart, ${count} items`}>
      <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
      <AnimatePresence>
        {ready && count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brass px-1 text-[11px] font-semibold text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
