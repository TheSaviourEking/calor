import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

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
  description: "An elevated destination for intimacy, wellness, and pleasure. Discreet shipping. Premium products. Pay by card, bank transfer, or crypto.",
  keywords: ["CALŌR", "intimacy", "wellness", "pleasure", "discreet shipping"],
  authors: [{ name: "CALŌR" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "CALŌR — Warmth lives here",
    description: "Intimacy & wellness, elevated. Curated products. Total discretion.",
    url: "https://calorco.com",
    siteName: "CALŌR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CALŌR — Warmth lives here",
    description: "Intimacy & wellness, elevated. Curated products. Total discretion.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${dmSans.variable} antialiased bg-warm-white text-charcoal min-h-screen flex flex-col`}
      >
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
