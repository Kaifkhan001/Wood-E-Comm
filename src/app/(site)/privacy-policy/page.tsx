import { Legal } from "@/components/layout/legal";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMeta({ title: "Privacy policy", description: `How ${site.name} collects, uses and protects your personal data.`, path: "/privacy-policy" });

export default function Privacy() {
  return (
    <Legal title="Privacy policy" updated="25 September 2026">
      <p>This policy explains what personal data {site.name} collects, why, and the choices you have. We follow India&apos;s Digital Personal Data Protection Act, 2023.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email address and, if you sign in with Google, your Google profile name and picture.</li>
        <li>Order and quote details: phone number, delivery address and anything you tell us about your home.</li>
        <li>Offer sign-ups: your mobile number, only when you tick the consent box.</li>
        <li>Usage data: pages visited and device type, only if you accept analytics cookies.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>To process orders and quotes, contact you about them, apply offers you signed up for, keep your account secure, and improve the website. We never sell your data.</p>
      <h2>Cookies</h2>
      <p>Essential cookies keep you signed in and remember your cookie choice. Your cart is stored in your browser. Analytics cookies (Google Analytics) load only after you choose &ldquo;Accept all&rdquo;. You can change this by clearing cookies for this site.</p>
      <h2>Who we share it with</h2>
      <p>Service providers who help us run the website (hosting, database, image storage, email, analytics) and delivery partners for your order. Each is bound to use the data only for that purpose.</p>
      <h2>How long we keep it</h2>
      <p>Order records are kept for eight years for tax purposes. Offer sign-ups and messages are deleted after two years of inactivity.</p>
      <h2>Your rights</h2>
      <p>You can ask to access, correct or delete your data, or withdraw consent, by emailing <a href={`mailto:${site.email}`} className="underline">{site.email}</a>. We respond within 30 days.</p>
    </Legal>
  );
}
