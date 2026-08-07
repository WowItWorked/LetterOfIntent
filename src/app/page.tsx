import Link from "next/link";
import { firm } from "@/config/firm";
import { sectionDefs } from "@/lib/content/sections";
import { fillName } from "@/lib/derive";
import { ResumeCard } from "@/components/home/ResumeCard";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* ------------------------------------------------------------- hero */}
      <section className="py-12 sm:py-16">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-accent">
          A free public tool from {firm.name}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">
          Write down what only you know about caring for them.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-body">
          A Letter of Intent is the guide a future caregiver, trustee, or guardian will
          rely on to care well for your loved one with a disability — the routines, the
          warning signs, the joys, the hard-won lessons. Everyone says to write one.
          This tool makes it possible: one small question at a time, saved as you go,
          finished as a polished PDF.
        </p>
        <div className="mt-8">
          <ResumeCard />
        </div>
        <div className="mt-8 max-w-2xl rounded-xl border border-line bg-surface p-5">
          <p className="flex items-start gap-2.5 font-medium text-ink">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-1 size-4 shrink-0 fill-accent">
              <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
            </svg>
            <span>
              {firm.privacyPromise}{" "}
              <Link href="/privacy" className="font-normal text-accent underline underline-offset-4">
                How that works
              </Link>
            </span>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------- what & why */}
      <section aria-labelledby="what-title" className="border-t border-line py-12">
        <h2 id="what-title" className="text-2xl sm:text-3xl">
          What is a Letter of Intent?
        </h2>
        <div className="mt-4 grid max-w-4xl gap-6 sm:grid-cols-2">
          <p className="text-body">
            It's a plain-language companion to a special needs trust and estate plan —
            not a legal document, and that's the point. No lawyer is needed. It's
            everything a future caregiver would need to know but could never guess:
            how your loved one communicates, what calms them, which doctor to call,
            what a good day looks like.
          </p>
          <p className="text-body">
            Most families are told to write one and never do, because a blank page is
            paralyzing. This tool replaces the blank page with small, answerable
            questions — and turns your answers into a document you can hand to a
            trustee, a sibling, a school, or an ER nurse.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section aria-labelledby="how-title" className="border-t border-line py-12">
        <h2 id="how-title" className="text-2xl sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-6 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              title: "Answer what you can",
              body: "Fifteen short sections, every question optional. Jump around. A 10-minute sitting is a real contribution.",
            },
            {
              title: "It saves on this device",
              body: "Autosave after every answer — close the tab tonight, continue Thursday. Download a backup file any time.",
            },
            {
              title: "Download two documents",
              body: "A polished, printable Letter of Intent — plus a one-page emergency sheet for sitters, school, and the ER.",
            },
          ].map((step, i) => (
            <li key={step.title} className="rounded-xl border border-line bg-surface p-5">
              <span aria-hidden="true" className="font-serif text-2xl text-golddeep">
                {i + 1}.
              </span>
              <h3 className="mt-1 text-lg">{step.title}</h3>
              <p className="mt-1.5 text-sm text-body">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------- what you'll cover */}
      <section aria-labelledby="cover-title" className="border-t border-line py-12">
        <h2 id="cover-title" className="text-2xl sm:text-3xl">
          What you'll cover
        </h2>
        <p className="mt-2 max-w-2xl text-body">
          Each section shows a time estimate, so you can pick one that fits the time
          you have tonight.
        </p>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sectionDefs.map((def) => (
            <li
              key={def.slug}
              className="flex min-h-11 items-baseline gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5"
            >
              <span aria-hidden="true" className="font-serif text-sm text-golddeep">
                {def.number}
              </span>
              <span className="flex-1 text-[0.95rem] text-ink">
                {fillName(def.navTitle, "your loved one")}
                {def.optionalTag ? <span className="text-faint"> (optional)</span> : null}
              </span>
              <span className="text-xs text-faint">{def.minutes} min</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------- closing CTA */}
      <section className="border-t border-line py-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl">Start with ten minutes.</h2>
          <p className="mt-3 text-body">
            You don't have to do this all at once, and you don't have to do it
            perfectly. A letter with three sections filled in is already worth more to
            a future caregiver than the perfect letter that never got written.
          </p>
          <div className="mt-6">
            <Link
              href="/letter/getting-started"
              className="inline-flex min-h-11 items-center rounded-md bg-[var(--btn-bg)] px-7 py-2 text-base font-medium text-[var(--btn-fg)] hover:bg-[var(--btn-bg-hover)]"
            >
              Begin your Letter of Intent
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
