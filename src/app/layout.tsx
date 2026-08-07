import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Mulish } from "next/font/google";
import "./globals.css";
import { firm } from "@/config/firm";
import { SETTINGS_BOOT_SCRIPT } from "@/lib/settings-store";
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
    title: "Write down what only you know about caring for them.",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "Letter of Intent Builder",
    description: DESCRIPTION,
  },
  icons: firm.logoPath ? { icon: firm.logoPath } : undefined,
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
      <head>
        {/* Applies saved text-size / contrast before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: SETTINGS_BOOT_SCRIPT }} />
      </head>
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
      </body>
    </html>
  );
}
