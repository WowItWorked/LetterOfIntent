import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Mulish } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { firm } from "@/config/firm";
import { GA_MEASUREMENT_ID } from "@/config/analytics";
import { ClientBoot } from "@/components/boot/ClientBoot";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { PrivacyStrip } from "@/components/chrome/PrivacyStrip";
import { SiteFooter } from "@/components/chrome/SiteFooter";

/**
 * Brand fonts, matching the marketing site: Cinzel for the engraved wordmark,
 * Cormorant Garamond for display serif, Mulish for body/UI. next/font bundles
 * them at build time and serves them same-origin — no runtime font requests,
 * so the "nothing leaves this device" promise and the CSP stay intact.
 */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mulish",
  display: "swap",
});

const DESCRIPTION =
  "A free, private tool that guides parents of a person with disabilities through " +
  "writing a Letter of Intent — and turns it into a polished PDF plus a one-page " +
  "emergency sheet. Everything stays on your device.";

export const metadata: Metadata = {
  // Canonical home of the tool (config/firm.ts) — resolves relative URLs in
  // canonical tags and link previews.
  metadataBase: new URL(firm.appUrl),
  title: {
    default: `Letter of Intent Builder — ${firm.name}`,
    template: `%s — Letter of Intent Builder`,
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Letter of Intent Builder",
    title:
      "Write down what only you know, so they’ll be cared for the way that only you have.",
    description: DESCRIPTION,
    // Without this, a chat app or social client with no image of its own to
    // show falls back to screenshotting whatever page was open when the link
    // was shared — which is how a watermarked sample document ended up as a
    // text-message preview. The lockup, generated once by
    // scripts/generate-og-image.mjs onto the site's own paper background, at
    // the 1200x630 size link previews are built around.
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "My Letter of Intent" }],
  },
  twitter: {
    // summary_large_image, not summary: the small square crop that "summary"
    // uses would cut the tagline off the bottom of this lockup.
    card: "summary_large_image",
    title: "Letter of Intent Builder",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  // No `icons` entry on purpose: src/app/favicon.ico is picked up by the file
  // convention, and naming one here as well would put two competing <link
  // rel="icon"> tags in the head.
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${mulish.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:text-ink focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ClientBoot />
        <SiteHeader />
        <PrivacyStrip />
        <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col outline-none">
          {children}
        </main>
        <SiteFooter />

        {/*
          Google Analytics 4. Counts page views; it is never handed anything
          from the letter — see config/analytics.ts and /privacy section 04.
          `afterInteractive` keeps it off the critical path, which matters on
          the slow connections a lot of this audience is on.
        */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-config" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
      </body>
    </html>
  );
}
