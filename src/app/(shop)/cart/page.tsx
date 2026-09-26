import { CartView } from "@/components/cart/cart-view";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Your cart", description: "Review the pieces in your cart.", path: "/cart", noindex: true });

export default function CartPage() {
  return (
    <div className="container-x pt-10 lg:pt-14">
      <h1 className="text-[40px] leading-tight sm:text-[52px]">Your cart</h1>
      <CartView />
    </div>
  );
}
