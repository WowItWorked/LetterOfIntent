import type { Metadata } from "next";
import Link from "next/link";
import { firm } from "@/config/firm";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Privacy & how your data works",
  description:
    "Everything you type stays on this device. No account, no analytics, no tracking " +
    "of any kind. Here is exactly how that works, in plain words.",
  alternates: { canonical: "/privacy" },
};

const ANCHOR = "calc(clamp(64px, 19vw, 124px) + 42px)";

const CONTENTS = [
  ["p1", "Where your answers live"],
  ["p2", "What that means in practice"],
  ["p3", "Why we never ask for numbers"],
  ["p4", "What we do and do not measure"],
  ["p5", "The yearly reminder"],
  ["p6", "The legal fine print, plainly"],
] as const;

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <>
      <div className="flex items-baseline gap-4">
        <span aria-hidden="true" className="tw-engraved flex-none text-[0.9375rem] text-accent">
          {n}
        </span>
        <h2 className="font-serif text-[2.25rem] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
      </div>
      <hr className="mt-3.5 h-px border-0 bg-line" />
    </>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[22px] max-w-[72ch] rounded-r-[var(--radius-md)] border-l-[3px] border-gold500 bg-gold100 px-[26px] py-[22px]">
      <p className="leading-[1.8]">{children}</p>
    </div>
  );
}

const sectionClass = "mt-[clamp(40px,5vw,60px)]";
const para = "mt-4 max-w-[72ch] leading-[1.8]";

export default function PrivacyPage() {
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "var(--container)",
        padding: "clamp(36px, 5vw, 72px) var(--gutter) 80px",
      }}
    >
      {/* ------------------------------------------------------ header panel */}
      <div
        className="rounded-[var(--radius-md)]"
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          boxShadow: "var(--shadow-md)",
          padding: "clamp(26px, 3.4vw, 44px) clamp(24px, 3.4vw, 44px)",
        }}
      >
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
          How your data works
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
          Your privacy, in plain words
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-[1.7] text-oninkbody">
          Everything you type stays on this device. We never see it, and it is never sent
          anywhere. One page, no legalese. Here is exactly how that works.
        </p>
      </div>

      {/* ------------------------------------------------------ three claims */}
      <div
        className="mt-[22px] grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))" }}
      >
        {[
          [
            "Nothing is uploaded",
            "Your letter is written to this browser's own storage. There is no server that receives it.",
          ],
          [
            "No account, and no analytics",
            "No sign-in anywhere on this site, and no analytics or tracking scripts of any kind — not ours, not anyone's.",
          ],
          [
            "Nothing to opt out of",
            "There is no cookie banner because the site sets no tracking cookies. Your letter is stored on this device, and only for you.",
          ],
        ].map(([title, body]) => (
          <div key={title} className="tw-card" style={{ boxShadow: "var(--shadow-xs)" }}>
            <div className="px-[22px] pb-[22px] pt-5">
              <p className="tw-engraved text-[0.6875rem] tracking-[0.2em] text-accent">
                {title}
              </p>
              <p className="mt-2 text-[0.9375rem] leading-[1.7] text-body">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------------- contents */}
      <nav
        aria-label="On this page"
        className="mt-[30px] rounded-[var(--radius-md)] border border-line bg-paper2 px-[22px] py-[18px]"
      >
        <p className="tw-engraved mb-3 text-[0.6875rem] tracking-[0.2em] text-accent">
          On this page
        </p>
        <ol
          className="grid list-none gap-x-6 gap-y-1 p-0"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}
        >
          {CONTENTS.map(([id, label], i) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex min-h-8 items-baseline gap-2.5 text-[0.9375rem] text-body hover:text-gold700"
              >
                <span className="tw-engraved text-[0.6875rem] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>{" "}
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ------------------------------------------------------------ 01 */}
      <section id="p1" className={sectionClass} style={{ scrollMarginTop: ANCHOR }}>
        <SectionHead n="01" title="Where your answers live" />
        <p className={para}>
          Everything you type is stored in your browser, on this device, in features
          called local storage and IndexedDB. It is never uploaded, transmitted, or
          synced by us. {firm.shortName} has no server that receives it, no database that
          holds it, and no way to see it.
        </p>
        <p className={para}>
          You can confirm this yourself: open your browser&rsquo;s developer tools while
          you type, and the network tab stays quiet.
        </p>
      </section>

      {/* ------------------------------------------------------------ 02 */}
      <section id="p2" className={sectionClass} style={{ scrollMarginTop: ANCHOR }}>
        <SectionHead n="02" title="What that means in practice" />
        <ul
          className="mt-5 grid list-none gap-4 p-0"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}
        >
          <li className="rounded-[var(--radius-md)] border border-line bg-surface px-6 py-[22px]">
            <p className="font-serif text-[1.375rem] leading-[1.3] text-ink">
              Your work stays here
            </p>
            <p className="mt-2.5 text-[0.9375rem] leading-[1.75]">
              Another computer or phone will not see it unless you move it there yourself
              with a backup file.
            </p>
          </li>
          <li className="rounded-[var(--radius-md)] border border-line bg-surface px-6 py-[22px]">
            <p className="font-serif text-[1.375rem] leading-[1.3] text-ink">
              Clearing browser data erases it
            </p>
            <p className="mt-2.5 text-[0.9375rem] leading-[1.75]">
              If you or a cleanup tool clear this site&rsquo;s data, the letter is gone.{" "}
              <Link href="/your-data" className="underline underline-offset-[3px]">
                Download a backup
              </Link>{" "}
              now and then. It takes one click.
            </p>
          </li>
          <li className="rounded-[var(--radius-md)] border border-line bg-surface px-6 py-[22px]">
            <p className="font-serif text-[1.375rem] leading-[1.3] text-ink">
              On a shared computer
            </p>
            <p className="mt-2.5 text-[0.9375rem] leading-[1.75]">
              At a library or on a family machine, use{" "}
              <Link href="/your-data" className="underline underline-offset-[3px]">
                Delete all my data
              </Link>{" "}
              when you finish, or work in a private window and export a backup first.
            </p>
          </li>
        </ul>
      </section>

      {/* ------------------------------------------------------------ 03 */}
      <section id="p3" className={sectionClass} style={{ scrollMarginTop: ANCHOR }}>
        <SectionHead
          n="03"
          title="Why we never ask for Social Security or account numbers"
        />
        <p className={para}>
          A Letter of Intent is meant to be copied and handed around: to caregivers,
          schools, hospitals, a trustee. Documents that travel should not carry numbers
          that can be abused.
        </p>
        <p className={para}>
          So this tool never asks for Social Security numbers, account numbers, or policy
          numbers. Instead, the letter records <em>where</em> your family keeps those, so
          the right person can find them and nobody else can.
        </p>
      </section>

      {/* ------------------------------------------------------------ 04 */}
      <section id="p4" className={sectionClass} style={{ scrollMarginTop: ANCHOR }}>
        <SectionHead n="04" title="What we do and do not measure" />
        <p className={para}>
          We measure nothing. This site runs no analytics: no Google Analytics, no
          product analytics, no heatmaps, no session recording, no advertising pixels, and
          no third-party scripts of any kind. We do not know how many people visit, which
          pages they open, or how far anyone gets. That is a deliberate trade — we give up
          knowing whether the tool is working in exchange for being able to say this
          without an asterisk.
        </p>
        <Callout>
          <strong className="font-semibold text-ink">
            Nothing you type into any field is captured
          </strong>
          , by us or by anyone else through this site. The words stay in this
          browser&rsquo;s own storage, and no script on this page reads them, sends them,
          or records your screen.
        </Callout>
        <p className="mt-5 max-w-[72ch] text-[0.9375rem] leading-[1.75] text-muted">
          The site sets no tracking cookies, so there is no cookie banner and nothing to
          opt out of. Our host keeps ordinary web server logs — the sort every website
          receives, including the address a request came from — and those are used only to
          keep the site up and secure.
        </p>
      </section>

      {/* ------------------------------------------------------------ 05 */}
      <section id="p5" className={sectionClass} style={{ scrollMarginTop: ANCHOR }}>
        <SectionHead n="05" title="The yearly reminder" />
        <p className={para}>
          At the end of the builder we offer a reminder to update your letter a year from
          now. Take the calendar file: it is made here on your device and sends nothing
          anywhere.
        </p>
        <Callout>
          The panel beside it offers an emailed reminder from {firm.shortName}.{" "}
          <strong className="font-semibold text-ink">
            That service is not running yet.
          </strong>{" "}
          Nothing is collected, stored, or transmitted if you type an address into it
          today. When it does run, this page will say so first, and the only thing sent
          will be your email address and the date — never a word of your letter.
        </Callout>
        <p className="mt-[22px] max-w-[72ch] text-[0.9375rem] leading-[1.75] text-muted">
          The two calendar links we offer beside the file, Google Calendar and Outlook,
          open those services with the reminder pre-filled. Only the event&rsquo;s title
          and date travel there, and only if you click them. Their own privacy terms apply
          once you are on their site. The same is true of the share buttons: they open
          another service with a message already written, and nothing from your letter
          goes with it.
        </p>
      </section>

      {/* ------------------------------------------------------------ 06 */}
      <section id="p6" className={sectionClass} style={{ scrollMarginTop: ANCHOR }}>
        <SectionHead n="06" title="The legal fine print, plainly" />
        <p className={para}>{firm.disclaimerFull}</p>
        {firm.advertisingNotice ? (
          <p className="mt-5 max-w-[72ch] rounded-[var(--radius-sm)] border border-line bg-paper2 px-5 py-4 text-[0.9375rem] leading-[1.75] text-muted">
            {firm.advertisingNotice}
          </p>
        ) : null}
      </section>

      {/* ---------------------------------------------------------- contact */}
      <section className="tw-card mt-[clamp(44px,5vw,64px)]">
        <div
          className="flex flex-wrap items-center gap-[clamp(18px,3vw,44px)]"
          style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}
        >
          <div className="min-w-0 flex-[3_1_340px]">
            <Eyebrow>Questions?</Eyebrow>
            <h2 className="mt-2 font-serif text-[1.75rem] font-semibold text-ink">
              Ask a person, not a form.
            </h2>
            <p className="mt-2.5 max-w-[60ch] leading-[1.75]">
              Call {firm.name} at{" "}
              <a href={firm.phoneHref} className="underline underline-offset-[3px]">
                {firm.phone}
              </a>
              , write to{" "}
              <a
                href={`mailto:${firm.email}`}
                className="underline underline-offset-[3px]"
              >
                {firm.email}
              </a>
              , or use the contact page on the firm&rsquo;s site.
            </p>
          </div>
          <div className="min-w-0 flex-[1_1_300px]">
            <a
              href={`${firm.website}/contact`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-navy700 bg-navy700 px-[26px] py-3.5 text-sm font-semibold uppercase tracking-[0.05em] text-onink transition-[background,transform] duration-[var(--dur-fast)] hover:-translate-y-px hover:bg-navy800 motion-reduce:transform-none motion-reduce:transition-none"
            >
              Contact the firm
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-[15px] flex-none fill-none stroke-current"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
            <p className="mt-2.5 text-xs leading-[1.6] text-muted">
              Opens {firm.websiteLabel} in a new tab.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
