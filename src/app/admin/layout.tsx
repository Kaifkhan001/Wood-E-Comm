import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate for every admin page. Actions and API routes check again on their own.
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-bottle text-paper lg:sticky lg:top-0 lg:h-dvh lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
          <Link href="/admin" className="font-display text-2xl">Aangan <span className="font-sans text-sm text-paper/60">admin</span></Link>
          <Link href="/" className="text-sm text-paper/70 hover:text-paper lg:mt-1 lg:block">View store</Link>
        </div>
        <AdminNav />
        <div className="hidden px-5 py-6 text-sm text-paper/70 lg:absolute lg:bottom-0 lg:block">
          <p className="truncate">{session.user.email}</p>
          <SignOutButton className="mt-2 underline underline-offset-4 hover:text-paper" />
        </div>
      </aside>
      <div className="min-w-0 px-5 py-8 sm:px-8 lg:px-10">{children}</div>
    </div>
  );
}
