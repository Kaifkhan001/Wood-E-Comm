import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isGoogleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { pageMeta } from "@/lib/seo";
import { safeNext } from "@/lib/safe-redirect";

export const metadata = pageMeta({ title: "Sign in", description: "Sign in to track your orders and quotes.", path: "/login", noindex: true });

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  if (await getSession()) redirect(safeNext(next));
  return <AuthForm mode="login" next={typeof next === "string" ? next : undefined} googleEnabled={isGoogleEnabled} />;
}
