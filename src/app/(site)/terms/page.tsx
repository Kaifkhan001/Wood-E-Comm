import { Legal } from "@/components/layout/legal";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMeta({ title: "Terms and conditions", description: `Terms for buying furniture and interior design services from ${site.name}.`, path: "/terms" });

export default function Terms() {
  return (
    <Legal title="Terms and conditions" updated="25 September 2026">
      <p>By using this website or placing an order request with {site.name}, you agree to these terms.</p>
      <h2>Order requests</h2>
      <p>Placing an order on this website sends us a request. It becomes a confirmed order only after our team calls or messages you to confirm availability, delivery date and price, and you complete payment. Prices shown include GST.</p>
      <h2>Delivery and installation</h2>
      <p>Delivery and installation are free within Mumbai, Thane and Pune city limits. Other locations are quoted before confirmation. Delivery dates are estimates and may shift for custom finishes.</p>
      <h2>Returns and cancellations</h2>
      <p>Order requests can be cancelled free of charge until they are confirmed. After confirmation, cancellations are subject to a fee for materials already cut. Damaged items reported within 48 hours of delivery are repaired or replaced.</p>
      <h2>Interior design projects</h2>
      <p>Quotes on this website are free and non-binding. Each project is governed by a separate written agreement covering scope, payment milestones and timelines.</p>
      <h2>Offers</h2>
      <p>The 5% welcome offer applies once per customer to a first furniture order, cannot be combined with other offers, and can be withdrawn at any time.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${site.email}`} className="underline">{site.email}</a>.</p>
    </Legal>
  );
}
