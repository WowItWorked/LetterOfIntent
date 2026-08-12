import Link from "next/link";

/**
 * The same box on all three document pages, pointing at the same destination.
 *
 * It links to /fillable-forms rather than downloading this page's own form,
 * on purpose: someone who wants the paper path almost never wants one document
 * in isolation — the letter and the emergency sheet are written from the same
 * afternoon — and a page showing all three can carry the two caveats (every
 * question asked, fixed-size boxes) that a download button cannot.
 */
export function FillableFormCallout({ document }: { document: string }) {
  return (
    <aside className="mt-6 overflow-hidden rounded-[var(--radius-md)] border border-goldline bg-goldtint">
      <div className="flex flex-wrap items-center gap-x-[clamp(20px,3vw,34px)] gap-y-4 px-[clamp(20px,3vw,34px)] py-6">
        <div className="min-w-0 flex-[3_1_360px]">
          <p className="text-lg leading-[1.7] text-body">
            <strong className="font-semibold text-ink">
              Would rather not use the web form?
            </strong>{" "}
            {document} is also available as a blank, fillable PDF. Type into it in
            Acrobat or Preview, or print it and write by hand.
          </p>
        </div>
        <div className="min-w-0 flex-[1_1_220px]">
          {/* Filled navy, not an outlined gold link. Gold-700 text on the gold
              tint measures just under 4.5:1 and axe fails it as serious — the
              two golds are close by design, which is what makes the panel calm
              and the outlined link unreadable. */}
          <Link
            href="/fillable-forms"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-navy700 px-6 py-3 text-center text-[0.8125rem] font-semibold uppercase leading-tight tracking-[0.08em] text-onink transition-colors duration-[var(--dur-fast)] hover:bg-navy800 motion-reduce:transition-none"
          >
            See all three forms
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
