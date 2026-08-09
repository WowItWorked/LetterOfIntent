import Link from "next/link";
import { PadlockIcon } from "@/components/ui/PadlockIcon";

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
        <PadlockIcon className="mt-[3px] size-[13px] fill-gold600" />
        <span className="min-w-0">
          Private by design. Everything you type stays on your device and is never sent
          anywhere.{" "}
          <Link
            href="/privacy"
            className="whitespace-nowrap font-semibold text-accent underline underline-offset-[3px]"
          >
            How it works
          </Link>
        </span>
      </p>
    </div>
  );
}
