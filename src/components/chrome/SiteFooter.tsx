import Link from "next/link";
import { firm } from "@/config/firm";

export function SiteFooter() {
  return (
    <footer className="print-hide mt-16 border-t border-line bg-paper2">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 text-sm text-muted">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="font-serif text-base text-ink">{firm.name}</span>
          <a className="underline-offset-4 hover:underline" href={firm.phoneHref}>
            {firm.phone}
          </a>
          <a className="underline-offset-4 hover:underline" href={`mailto:${firm.email}`}>
            {firm.email}
          </a>
          <a
            className="underline-offset-4 hover:underline"
            href={firm.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {firm.websiteLabel}
          </a>
          <Link className="underline-offset-4 hover:underline" href="/privacy">
            Privacy &amp; how your data works
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/your-data">
            Export, import, or delete your data
          </Link>
        </div>
        <p className="max-w-3xl">{firm.disclaimerShort}</p>
        {firm.advertisingNotice ? <p className="max-w-3xl">{firm.advertisingNotice}</p> : null}
        <p>
          This tool is free. No account, no email address, and nothing you type ever
          leaves your device.
        </p>
      </div>
    </footer>
  );
}
