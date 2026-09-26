"use client";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Toaster position="top-center" toastOptions={{ className: "!font-sans" }} />
    </CartProvider>
  );
}
