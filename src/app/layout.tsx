import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSiteUrl } from "@/lib/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
const plausibleApiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST?.trim() || "https://plausible.io";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Vanløse IF - Københavns mest ambitiøse klub",
    template: "%s",
  },
  description:
    "Vanløse IF - Stolthed & Passion. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.",
  openGraph: {
    type: "website",
    locale: "da_DK",
    siteName: "Vanløse IF",
    title: "Vanløse IF - Københavns mest ambitiøse klub",
    description:
      "Vanløse IF - Stolthed & Passion. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.",
    url: siteUrl ?? undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanløse IF - Københavns mest ambitiøse klub",
    description:
      "Vanløse IF - Stolthed & Passion. Oplev intensiteten på Vanløse Idrætspark. Siden 1921.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className={`${geistSans.variable} antialiased`}>
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src={`${plausibleApiHost}/js/script.js`}
          />
        )}
        {children}
      </body>
    </html>
  );
}
