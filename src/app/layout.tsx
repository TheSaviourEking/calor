import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CALŌR — Intimacy & Wellness, Elevated",
  description:
    "An elevated destination for intimacy, wellness, and pleasure. Discreet shipping. Premium products. Pay by card, bank transfer, or crypto.",
  keywords: ["CALŌR", "intimacy", "wellness", "pleasure", "discreet shipping"],
  authors: [{ name: "CALŌR" }],
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "CALŌR — Warmth lives here",
    description:
      "Intimacy & wellness, elevated. Curated products. Total discretion.",
    url: "https://calorco.com",
    siteName: "CALŌR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CALŌR — Warmth lives here",
    description:
      "Intimacy & wellness, elevated. Curated products. Total discretion.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${dmSans.variable} antialiased bg-warm-white text-charcoal min-h-screen flex flex-col`}
      >
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
