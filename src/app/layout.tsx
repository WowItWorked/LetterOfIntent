import type { Metadata, Viewport } from "next";
import "./globals.css";
import { firm } from "@/config/firm";
import { SETTINGS_BOOT_SCRIPT } from "@/lib/settings-store";
import { ClientBoot } from "@/components/boot/ClientBoot";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: `Letter of Intent Builder — ${firm.name}`,
    template: `%s — Letter of Intent Builder`,
  },
  description:
    "A free, private tool that guides parents of a person with disabilities through " +
    "writing a Letter of Intent — and turns it into a polished PDF plus a one-page " +
    "emergency sheet. Everything stays on your device.",
  icons: firm.logoPath ? { icon: firm.logoPath } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
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
        <main id="main" tabIndex={-1} className="flex w-full flex-1 flex-col outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
