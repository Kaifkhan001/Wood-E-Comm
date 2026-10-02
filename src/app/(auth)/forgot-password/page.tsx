import { redirect } from "next/navigation";
import { ForgotForm } from "@/components/auth/password-reset";
import { getSession } from "@/lib/session";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Reset password", description: "Reset your account password.", path: "/forgot-password", noindex: true });

export default async function Page() {
  if (await getSession()) redirect("/auth/continue");
  return <ForgotForm />;
}
