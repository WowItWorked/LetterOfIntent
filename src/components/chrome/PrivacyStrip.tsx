import Link from "next/link";

/**
 * The privacy promise, in its own cream band under the masthead. The link is
 * part of the sentence rather than a sibling flex item, so the whole thing
 * wraps as one paragraph on narrow screens.
 */
export function PrivacyStrip() {
  return (
    <div className="print-hide border-b border-line bg-paper2">
      <p
        className="mx-auto flex items-start gap-2 text-xs leading-[1.5] text-muted"
        style={{
          maxWidth: "var(--container)",
          padding: "10px var(--gutter) 11px",
          textWrap: "pretty",
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="mt-[3px] size-[13px] flex-none fill-gold600"
        >
          <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
        </svg>
        <span className="min-w-0">
          Private by design. Everything you type stays on this device and is never sent
          anywhere.{" "}
          <Link
            href="/privacy"
            className="whitespace-nowrap font-semibold text-accent underline underline-offset-[3px]"
          >
            How that works
          </Link>
        </span>
      </p>
    </div>
  );
}
