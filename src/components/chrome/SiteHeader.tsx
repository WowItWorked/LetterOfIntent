"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SaveIndicator } from "@/components/chrome/SaveIndicator";
import { ShareIcon } from "@/components/ui/ShareIcon";

/** Below this width the nav collapses to a hamburger. The only breakpoint on
 *  the site — everything else responds through clamp() and auto-fit grids.
 *  Raised from 1100 when the Care cards and Emergency sheet links joined the
 *  row: five items need the room, and a crowded masthead collapses early
 *  rather than wraps. */
const COMPACT_BELOW = 1200;


/**
 * Sticky masthead: the My Letter of Intent lockup and one primary action.
 *
 * Deliberately one filled control only. Share sits beside it as a quiet
 * labelled link rather than a matching icon button, because sharing is a
 * smaller ask than starting and the hero offers it again at a better moment.
 * Privacy is not here at all — the strip directly below already carries it as
 * a sentence in context ("How that works"), and two routes to one page a row
 * apart is a choice the reader should not have to make. Under 1100px both
 * collapse into a hamburger menu, which does list Privacy: a menu is a site
 * map, not a row of competing buttons.
 */
/** The four document pages, shared by the dropdown and the mobile menu. */
const DOCUMENT_LINKS = [
  ["Letter of Intent", "/letter-of-intent"],
  // "Caregiver Letter", not the document's full name: four items in one
  // dropdown, and the masthead collapses at 1200px as it is.
  ["Caregiver Letter", "/letter-for-the-caregiver"],
  ["Emergency Sheet", "/emergency-sheet"],
  ["Care Cards", "/care-cards"],
] as const;

/**
 * What you can do with what you have already written, as opposed to what the
 * pages above explain.
 *
 * Review & Download goes to /letter/review, not to the your-data card that
 * also hands out files: review is where the documents are built and seen
 * before they are saved, and it is where every other route into them already
 * points (the wizard, the reading view, the cards screen, the resume card).
 *
 * "Back up or delete" is the phrase the footer already uses for /your-data —
 * one name for one destination, rather than a second wording to reconcile.
 */
const DATA_LINKS = [
  ["Back up or delete", "/your-data"],
  ["Review & Download", "/letter/review"],
] as const;

export function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COMPACT_BELOW - 1}px)`);
    const apply = () => {
      setCompact(mq.matches);
      if (!mq.matches) setMenuOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // A route change with the menu still open would leave it covering the new
  // page — including back/forward, which no click handler sees. Adjusted
  // during render rather than in an effect, so there is no flash of the old
  // menu over the new route.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
    setDocsOpen(false);
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className="print-hide sticky top-0 border-b border-line bg-[rgba(251,250,246,0.93)] backdrop-blur-[10px]"
      style={{ zIndex: "var(--z-sticky)", boxShadow: "var(--shadow-xs)" }}
    >
      <div
        className="mx-auto flex items-center gap-x-[clamp(12px,1.6vw,20px)] gap-y-2"
        style={{
          maxWidth: "var(--container)",
          padding: "clamp(8px, 1.4vw, 12px) var(--gutter)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-[clamp(10px,1.5vw,20px)] rounded-md"
          aria-label="My Letter of Intent, home"
        >
          <Image
            src="/mloi-lockup-horizontal-2x.png"
            alt="My Letter of Intent"
            width={779}
            height={248}
            priority
            className="block h-[clamp(64px,19vw,124px)] w-auto"
          />
          {/*
            No "Letter of Intent Builder" label beside the lockup: the artwork
            already reads "My Letter of Intent" over the tagline, so the label
            was the third statement of the same thing and the widest item in
            the row.
          */}
        </Link>

        <div className="ml-auto flex items-center gap-[clamp(4px,1.2vw,14px)]">
          <SaveIndicator />

          {!compact ? (
            <nav aria-label="Main" className="flex items-center gap-2.5">
              {/* Same promise as the hero button, so nobody has to work out
                  whether the two lead to the same place. */}
              <Link
                href="/letter"
                className="inline-flex min-h-11 items-center gap-[9px] whitespace-nowrap rounded-[var(--radius-sm)] bg-navy700 px-5 text-xs font-semibold uppercase tracking-[0.09em] text-onink transition-[background,transform] duration-[var(--dur-fast)] hover:-translate-y-px hover:bg-navy800 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="tw-diamond" aria-hidden="true" />
                Start your letter &middot; it&rsquo;s free
              </Link>
              {/* One Documents dropdown instead of a row of page links — the
                  masthead stays one filled action plus quiet utilities. */}
              <div
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDocsOpen(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setDocsOpen(false);
                }}
              >
                <button
                  type="button"
                  onClick={() => setDocsOpen((v) => !v)}
                  aria-expanded={docsOpen}
                  aria-controls="docs-menu"
                  className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] pl-3 pr-1.5 text-xs font-semibold uppercase tracking-[0.09em] text-muted transition-colors duration-[var(--dur-fast)] hover:text-gold700 motion-reduce:transition-none"
                >
                  Resources
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className={`size-3 flex-none fill-none stroke-current transition-transform duration-[var(--dur-fast)] motion-reduce:transition-none ${docsOpen ? "rotate-180" : ""}`}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 8 5 5 5-5" />
                  </svg>
                </button>
                {docsOpen ? (
                  <div
                    id="docs-menu"
                    className="absolute right-0 top-full z-10 mt-1 min-w-[228px] rounded-[var(--radius-sm)] border border-line bg-surface py-1.5"
                    style={{ boxShadow: "var(--shadow-md)" }}
                  >
                    {DOCUMENT_LINKS.map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setDocsOpen(false)}
                        className="block px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.09em] text-navy700 hover:bg-paper2 hover:text-gold700"
                      >
                        {label}
                      </Link>
                    ))}
                    {/* A rule, not a heading: the two groups answer different
                        questions — what these documents are, and what to do
                        with the one you have written. */}
                    <hr className="my-1.5 h-px border-0 bg-line" />
                    {DATA_LINKS.map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setDocsOpen(false)}
                        className="block px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.09em] text-navy700 hover:bg-paper2 hover:text-gold700"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <Link
                href="/#pass-it-along"
                className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] pl-1.5 pr-3 text-xs font-semibold uppercase tracking-[0.09em] text-muted transition-colors duration-[var(--dur-fast)] hover:text-gold700 motion-reduce:transition-none"
              >
                <ShareIcon />
                Share
              </Link>
            </nav>
          ) : (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="inline-flex min-h-[46px] min-w-[46px] items-center justify-center rounded-[var(--radius-sm)] border border-line2 px-3 text-navy700 transition-colors duration-[var(--dur-fast)] hover:border-gold500 hover:text-gold700 motion-reduce:transition-none"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-5 fill-none stroke-current"
                strokeWidth={1.6}
                strokeLinecap="round"
              >
                {menuOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
              </svg>
            </button>
          )}
        </div>
      </div>

      {compact && menuOpen ? (
        <nav id="site-menu" aria-label="Main" className="border-t border-line bg-paper">
          <div
            className="mx-auto flex flex-col"
            style={{ maxWidth: "var(--container)", padding: "6px var(--gutter) 14px" }}
          >
            <Link
              href="/letter"
              onClick={closeMenu}
              className="my-2 mb-3 flex min-h-[52px] items-center justify-center gap-2.5 rounded-[var(--radius-sm)] bg-navy700 px-5 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-onink hover:bg-navy800"
            >
              <span className="tw-diamond" aria-hidden="true" />
              Start your letter &middot; it&rsquo;s free
            </Link>
            <Link
              href="/letter-of-intent"
              onClick={closeMenu}
              className="flex min-h-[52px] items-center border-b border-line px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
            >
              Letter of Intent
            </Link>
            <Link
              href="/letter-for-the-caregiver"
              onClick={closeMenu}
              className="flex min-h-[52px] items-center border-b border-line px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
            >
              Caregiver Letter
            </Link>
            <Link
              href="/care-cards"
              onClick={closeMenu}
              className="flex min-h-[52px] items-center border-b border-line px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
            >
              Care cards
            </Link>
            <Link
              href="/emergency-sheet"
              onClick={closeMenu}
              className="flex min-h-[52px] items-center border-b border-line px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
            >
              Emergency sheet
            </Link>
            {/* Same two data links as the desktop dropdown. This menu spells
                its items out rather than mapping the arrays, so anything added
                to DATA_LINKS has to be added here too. */}
            {DATA_LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                className="flex min-h-[52px] items-center border-b border-line px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/#pass-it-along"
              onClick={closeMenu}
              className="flex min-h-[52px] items-center border-b border-line px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
            >
              Share
            </Link>
            <Link
              href="/privacy"
              onClick={closeMenu}
              className="flex min-h-[52px] items-center px-1 text-[0.9375rem] font-semibold uppercase tracking-[0.09em] text-navy700 hover:text-gold700"
            >
              Privacy
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
