"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Tags, ShoppingCart, Ruler, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/quotes", label: "Interior quotes", icon: Ruler },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/messages", label: "Messages and leads", icon: Inbox },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:px-3">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-[15px]", active ? "bg-paper/15 text-paper" : "text-paper/75 hover:bg-paper/10 hover:text-paper")}>
                <Icon className="h-4 w-4" strokeWidth={1.8} /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
