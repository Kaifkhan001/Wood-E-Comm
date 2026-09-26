// Public business details. Everything here is safe to ship to the browser.
export const site = {
  name: "Aangan Living",
  shortName: "Aangan",
  tagline: "Furniture and interiors for Indian homes",
  description:
    "Solid-wood furniture made to last, and end-to-end interior design for new flats and renovations in Mumbai and across India.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_IN",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@aanganliving.in",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 98000 00000",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919800000000").replace(/\D/g, ""),
  address: {
    street: "Studio 4, Linking Road",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400050",
    country: "IN",
  },
  hours: "Mon–Sat, 10am to 7pm",
  socials: {
    instagram: "https://instagram.com/aanganliving",
    facebook: "https://facebook.com/aanganliving",
    youtube: "https://youtube.com/@aanganliving",
  },
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const nav = [
  { href: "/furniture", label: "Furniture" },
  { href: "/interior-design", label: "Interior design" },
  { href: "/get-a-quote", label: "Get a quote" },
  { href: "/contact", label: "Contact" },
] as const;
