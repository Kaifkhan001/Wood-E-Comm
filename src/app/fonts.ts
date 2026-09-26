import localFont from "next/font/local";

// Self-hosted: no request to Google Fonts, no layout shift.
export const gloock = localFont({
  src: "../fonts/gloock.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-gloock",
});

export const figtree = localFont({
  src: "../fonts/figtree.woff2",
  weight: "300 800",
  display: "swap",
  variable: "--font-figtree",
});
