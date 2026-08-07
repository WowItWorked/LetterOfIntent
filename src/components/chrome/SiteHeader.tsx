import Image from "next/image";
import Link from "next/link";
import { firm } from "@/config/firm";
import { ContrastToggle, TextSizeControl } from "@/components/chrome/A11yControls";
import { SaveIndicator } from "@/components/chrome/SaveIndicator";

export function SiteHeader() {
  return (
    <header className="print-hide sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 rounded-md"
          aria-label={`${firm.name} — Letter of Intent Builder, home`}
        >
          {firm.logoPath ? (
            <Image
              src={firm.logoPath}
              alt=""
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
              priority
            />
          ) : null}
          <span className="leading-tight">
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
              {firm.shortName}
            </span>
            <span className="block font-serif text-[1.05rem] text-ink">
              Letter of Intent Builder
            </span>
          </span>
        </Link>

        <Link
          href="/privacy"
          className="hidden min-h-11 items-center gap-1.5 rounded-md text-sm text-muted underline-offset-4 hover:text-ink hover:underline md:flex"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
            <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
          </svg>
          Private — stays on this device
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SaveIndicator />
          <TextSizeControl />
          <ContrastToggle />
          <Link
            href="/your-data"
            className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-muted hover:text-ink"
          >
            Your data
          </Link>
        </div>
      </div>
    </header>
  );
}
