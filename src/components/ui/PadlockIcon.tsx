/**
 * The gold padlock that marks a privacy note.
 *
 * One definition rather than a copy per site, so the three places that make
 * this promise — the strip under the masthead, the hero reassurance box, and
 * the share card — keep reading as the same note rather than three unrelated
 * remarks that happen to be about privacy.
 *
 * Decorative by default: every use so far sits immediately beside text that
 * already says the thing, so announcing it again would only add noise for a
 * screen reader.
 */
export function PadlockIcon({ className = "size-[14px]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`${className} flex-none`}>
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
    </svg>
  );
}
