import Image from "next/image";
import Link from "next/link";
import { firm } from "@/config/firm";
import { ContrastToggle, TextSizeControl } from "@/components/chrome/A11yControls";
import { SaveIndicator } from "@/components/chrome/SaveIndicator";

/**
 * Navy masthead mirroring the marketing site's brand lockup: engraved Cinzel
 * "TRUSTS & WEALTH" with the gold ampersand and tucked PLLC, then the product
 * name as a letterspaced Mulish label beside a gold hairline.
 */
export function SiteHeader() {
  return (
    <header className="site-header print-hide sticky top-0 z-40 border-b border-[var(--header-line)] bg-[var(--header-bg)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-0.5 px-4 py-2.5">
        <Link
          href="/"
          className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-0.5 rounded-md"
          aria-label={`${firm.name} — Letter of Intent Builder, home`}
        >
          {firm.logoPath ? (
            // The monogram is a tall mark (395×578) — width follows height.
            <Image
              src={firm.logoPath}
              alt=""
              width={28}
              height={41}
              className="h-10 w-auto object-contain"
              priority
            />
          ) : null}
          <span className="font-brand text-[1.08rem] font-medium leading-none tracking-[0.18em] text-[var(--header-fg)]">
            TRUSTS{" "}
            <span className="relative inline-block text-[var(--header-accent)]">
              &amp;
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-full mt-[3px] -translate-x-1/2 font-sans text-[0.42rem] font-semibold tracking-[0.24em] text-[var(--header-muted)] max-sm:hidden"
              >
                PLLC
              </span>
            </span>{" "}
            WEALTH
          </span>
          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-[var(--header-accent)] opacity-50 sm:block"
          />
          <span className="font-sans text-[0.68rem] font-semibold uppercase leading-none tracking-[0.22em] text-[var(--header-fg)]">
            Letter of Intent Builder
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SaveIndicator />
          <TextSizeControl />
          <ContrastToggle />
          <Link
            href="/your-data"
            className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-[var(--header-muted)] hover:text-[var(--header-fg)]"
          >
            Your data
          </Link>
        </div>
      </div>
    </header>
  );
}
