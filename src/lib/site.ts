// Public business details. Everything here is safe to ship to the browser.
export const site = {
  name: "Wood & Wonders",
  shortName: "Wood & Wonders",
  tagline: "Furniture and interiors for Indian homes",
  description:
    "Solid-wood furniture made to last, and end-to-end interior design for new flats and renovations in Mumbai and across India.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_IN",
  email: "woodwonderind@gmail.com",
  phone:  "+91 98192 56235",
  whatsapp: ("919819256235").replace(/\D/g, ""),
  address: {
    street: "B/F, 11, Saraf Kaskar Industrial Estate, Swami Vivekanand Rd, near Oshiwara Bridge, Oshiwara, Jogeshwari West",
    city: "Mumbai",
    region: "Maharashtra",
    postalCode: "400102",
    country: "IN",
  },
  // TODO: confirm business hours
  hours: "Mon–Sat, 10am to 7pm",
  // Same address as `address`, broken into natural lines for display so it never overflows narrow screens.
  addressLines: [
    "B/F, 11, Saraf Kaskar Industrial Estate,",
    "Swami Vivekanand Rd, near Oshiwara Bridge,",
    "Oshiwara, Jogeshwari West, Mumbai 400102",
  ],
  socials: {
    instagram: "https://www.instagram.com/woodandwonders.in/",
    instagramHandle: "@woodandwonders.in",
  },
} as const;

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mapsLink() {
  const full = `Wood and Wonders, ${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full)}`;
}

export const nav = [
  { href: "/furniture", label: "Furniture" },
  { href: "/interior-design", label: "Interior design" },
  { href: "/get-a-quote", label: "Get a quote" },
  { href: "/contact", label: "Contact" },
] as const;
