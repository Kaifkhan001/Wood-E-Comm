import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isGoogleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { pageMeta } from "@/lib/seo";
import { safeNext } from "@/lib/safe-redirect";

export const metadata = pageMeta({ title: "Sign in", description: "Sign in to track your orders and quotes.", path: "/login", noindex: true });

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  // A real, validated session only (never the proxy's cookie-existence check), so a
  // stale/expired cookie can never bounce a signed-out visitor back here in a loop.
  if (await getSession()) redirect(`/auth/continue?next=${encodeURIComponent(safeNext(next, ""))}`);
  return <AuthForm mode="login" next={typeof next === "string" ? next : undefined} googleEnabled={isGoogleEnabled} />;
}
