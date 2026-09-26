"use client";
import { usePathname } from "next/navigation";

/** Hides storefront chrome (header, footer, popups) inside the admin panel. */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
