import type { Metadata, Viewport } from "next";
import "./globals.css";
import { figtree, gloock } from "./fonts";
import { Providers } from "./providers";
import { site } from "@/lib/site";
import { JsonLd, organizationJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactDock } from "@/components/layout/contact-dock";
import { CookieBanner } from "@/components/marketing/cookie-banner";
import { DiscountPopup } from "@/components/marketing/discount-popup";
import { Analytics } from "@/components/marketing/analytics";
import { PublicOnly } from "@/components/layout/public-only";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: solid-wood furniture and interior design in Mumbai`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { siteName: site.name, locale: site.locale, type: "website" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#e7e8e2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${gloock.variable} ${figtree.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-paper focus:px-4 focus:py-2">
          Skip to content
        </a>
        <Providers>
          <PublicOnly><Header /></PublicOnly>
          <main id="main">{children}</main>
          <PublicOnly>
            <Footer />
            <ContactDock />
            <CookieBanner />
            <DiscountPopup />
          </PublicOnly>
        </Providers>
        <Analytics />
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  );
}
