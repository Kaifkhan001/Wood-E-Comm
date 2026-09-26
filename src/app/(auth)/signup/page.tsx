import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isGoogleEnabled } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { pageMeta } from "@/lib/seo";
import { safeNext } from "@/lib/safe-redirect";

export const metadata = pageMeta({ title: "Create an account", description: "Create an account to order furniture and track quotes.", path: "/signup", noindex: true });

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  if (await getSession()) redirect(safeNext(next));
  return <AuthForm mode="signup" next={typeof next === "string" ? next : undefined} googleEnabled={isGoogleEnabled} />;
}
