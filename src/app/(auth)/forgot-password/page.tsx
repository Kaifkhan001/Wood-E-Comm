import { ForgotForm } from "@/components/auth/password-reset";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Reset password", description: "Reset your account password.", path: "/forgot-password", noindex: true });
export default function Page() {
  return <ForgotForm />;
}
