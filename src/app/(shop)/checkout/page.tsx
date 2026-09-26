import { CheckoutForm } from "@/components/cart/checkout-form";
import { requireUser } from "@/lib/session";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Place your order request", description: "Confirm your delivery details.", path: "/checkout", noindex: true });

export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  return (
    <div className="container-x pt-10 lg:pt-14">
      <h1 className="text-[40px] leading-tight sm:text-[52px]">Order request</h1>
      <p className="mt-2 text-muted">Signed in as {session.user.email}</p>
      <CheckoutForm defaultName={session.user.name} />
    </div>
  );
}
