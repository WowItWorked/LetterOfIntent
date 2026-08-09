/**
 * Three nodes joined by two lines — the "share graph" glyph.
 *
 * One component rather than a copy per button, because the shape it replaced
 * (an arrow into a tray) is the same one browsers use for upload, and a tool
 * whose central promise is that nothing is uploaded cannot afford to draw that
 * icon anywhere. Keeping a single definition is what stops the old one
 * creeping back into one button and not the others.
 */
export function ShareIcon({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`${className} flex-none fill-none stroke-current`}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="m8.3 10.7 7.4-4.3M8.3 13.3l7.4 4.3" />
    </svg>
  );
}
