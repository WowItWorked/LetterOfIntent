import Image from "next/image";
import Link from "next/link";
import { firm } from "@/config/firm";

const engraved = "tw-engraved text-[10px] text-accent";
const columnLink =
  "text-[0.9375rem] text-body transition-colors duration-[var(--dur-fast)] hover:text-gold700 motion-reduce:transition-none";

/**
 * Four columns on cream: the firm's monogram, the tool's links, how to reach
 * the firm, and the share prompt — then the fine print below a hairline.
 */
export function SiteFooter() {
  return (
    <footer
      className="print-hide border-t border-line bg-paper2 text-body"
      style={{ padding: "clamp(48px, 6vw, 72px) var(--gutter) 56px" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
        <div className="flex flex-wrap items-start gap-x-14 gap-y-11">
          {/* ------------------------------------------------------- firm */}
          <div className="min-w-0 max-w-[400px] flex-[1_1_280px]">
            <div className="flex items-center gap-4">
              {firm.logoPath ? (
                <Image
                  src={firm.logoPath}
                  alt=""
                  width={395}
                  height={578}
                  className="block h-12 w-auto flex-none"
                />
              ) : null}
              <span className="min-w-0">
                <span className="block font-serif text-[1.375rem] leading-[1.2] text-ink">
                  {firm.name}
                </span>
                <span className={`${engraved} mt-[5px] block`} style={{ letterSpacing: "0.18em" }}>
                  Estate and Tax Planning · {firm.licensedStates.join(" · ")}
                </span>
              </span>
            </div>
            <p className="mt-[18px] text-[0.9375rem] leading-[1.7] text-muted">
              My Letter of Intent is provided free by the firm, as a service to families
              writing for someone they care for.
            </p>
          </div>

          {/* --------------------------------------------------- the tool */}
          <nav className="flex min-w-0 flex-[1_1_170px] flex-col gap-3">
            <p className={`${engraved} mb-0.5`} style={{ letterSpacing: "0.2em" }}>
              The tool
            </p>
            <Link href="/letter" className={columnLink}>
              Start your letter
            </Link>
            <Link href="/privacy" className={columnLink}>
              Privacy &amp; your data
            </Link>
            <Link href="/your-data" className={columnLink}>
              Back up or delete
            </Link>
          </nav>

          {/* ---------------------------------------------------- contact */}
          <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-3">
            <p className={`${engraved} mb-0.5`} style={{ letterSpacing: "0.2em" }}>
              Contact
            </p>
            <a href={firm.phoneHref} className={columnLink}>
              {firm.phone}
            </a>
            <a href={`mailto:${firm.email}`} className={`${columnLink} break-words`}>
              {firm.email}
            </a>
            <a
              href={firm.website}
              target="_blank"
              rel="noopener noreferrer"
              className={columnLink}
            >
              {firm.websiteLabel}
            </a>
          </div>

          {/* ---------------------------------------------- pass it along */}
          <div className="min-w-0 flex-[1_1_220px]">
            <p className={`${engraved} mb-3.5`} style={{ letterSpacing: "0.2em" }}>
              Pass it along
            </p>
            <p className="text-[0.9375rem] leading-[1.7] text-muted">
              If someone you know is caring for a loved one, send it their way. Nothing you
              have written goes with it.
            </p>
            <Link
              href="/#pass-it-along"
              className="mt-4 flex min-h-11 max-w-[260px] items-center justify-between gap-2.5 rounded-[var(--radius-sm)] border border-line2 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-navy700 transition-colors duration-[var(--dur-fast)] hover:border-gold500 hover:text-gold700 motion-reduce:transition-none"
            >
              Ways to share
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-[15px] flex-none fill-none stroke-current"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12h15m0 0-5-5m5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>

        <hr className="my-11 mb-7 h-px border-0 bg-line" />

        <div
          className="grid gap-x-[clamp(28px,4vw,56px)] gap-y-[18px] text-[0.75rem] leading-[1.85] text-muted"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}
        >
          <p>{firm.disclaimerShort}</p>
          {firm.advertisingNotice ? <p>{firm.advertisingNotice}</p> : null}
          <p>
            This tool is free. No account and no email address required, and nothing you
            type ever leaves your device.
          </p>
        </div>
      </div>
    </footer>
  );
}
