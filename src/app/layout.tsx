import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSiteUrl } from "@/lib/metadata";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
const plausibleApiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST?.trim() || "https://plausible.io";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Vanløse IF - Københavns mest ambitiøse klub",
    template: "%s",
  },
  description:
    "Vanløse IF. Fodbold på Vanløse Idrætspark siden 1921.",
  openGraph: {
    type: "website",
    locale: "da_DK",
    siteName: "Vanløse IF",
    title: "Vanløse IF - Københavns mest ambitiøse klub",
    description:
      "Vanløse IF. Fodbold på Vanløse Idrætspark siden 1921.",
    url: siteUrl ?? undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanløse IF - Københavns mest ambitiøse klub",
    description:
      "Vanløse IF. Fodbold på Vanløse Idrætspark siden 1921.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className={`${bebasNeue.variable} ${outfit.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2.5 focus:text-xs focus:font-bold focus:uppercase focus:tracking-widest focus:text-white focus-visible:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-accent"
        >
          Gå til indhold
        </a>
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
