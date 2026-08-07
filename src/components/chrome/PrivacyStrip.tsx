import Link from "next/link";

/**
 * The privacy promise, in its own quiet band under the masthead — visible on
 * every page without crowding the brand row.
 */
export function PrivacyStrip() {
  return (
    <div className="print-hide border-b border-line bg-paper2">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 px-4 text-[0.82rem] text-muted">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-accent">
          <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
        </svg>
        <span className="py-2">
          Private by design — everything you type stays on this device, never sent anywhere.
        </span>
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-4 hover:underline"
        >
          How that works
        </Link>
      </p>
    </div>
  );
}
