import { ResetForm } from "@/components/auth/password-reset";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Choose a new password", description: "Set a new password.", path: "/reset-password", noindex: true });
export default async function Page({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return <ResetForm token={typeof token === "string" ? token.slice(0, 200) : ""} />;
}
