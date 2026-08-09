"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SaveIndicator } from "@/components/chrome/SaveIndicator";

/** Below this width the nav collapses to a hamburger. The only breakpoint on
 *  the site — everything else responds through clamp() and auto-fit grids. */
const COMPACT_BELOW = 1100;

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[18px] fill-none stroke-current"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" />
      <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  );
}

function PadlockIcon({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`${className} fill-current`}>
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
    </svg>
  );
}

/**
 * Sticky masthead: the My Letter of Intent lockup, a gold hairline, and the
 * engraved product label, with Start now plus share and privacy icon buttons.
 * Under 1100px the three collapse into a hamburger menu.
 */
export function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
          {!compact ? (
            <>
              <span
                aria-hidden="true"
                className="h-[clamp(50px,13.3vw,88px)] w-px opacity-70"
                style={{ background: "var(--gradient-gold)" }}
              />
              <span
                className="tw-engraved whitespace-nowrap text-[clamp(9px,2.3vw,15px)] leading-[1.85] text-navy700"
                style={{ letterSpacing: "0.16em" }}
              >
                Letter of<span className="block">Intent</span>
                <span className="block">Builder</span>
              </span>
            </>
          ) : null}
        </Link>

        <div className="ml-auto flex items-center gap-[clamp(4px,1.2vw,14px)]">
          <SaveIndicator />

          {!compact ? (
            <nav aria-label="Main" className="flex items-center gap-2.5">
              <Link
                href="/letter"
                className="inline-flex min-h-11 items-center gap-[9px] whitespace-nowrap rounded-[var(--radius-sm)] bg-navy700 px-5 text-xs font-semibold uppercase tracking-[0.09em] text-onink transition-[background,transform] duration-[var(--dur-fast)] hover:-translate-y-px hover:bg-navy800 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="tw-diamond" aria-hidden="true" />
                Start now
              </Link>
              <Link
                href="/#pass-it-along"
                aria-label="Share this tool"
                title="Share this tool"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line2 text-navy700 transition-colors duration-[var(--dur-fast)] hover:border-gold500 hover:text-gold700 motion-reduce:transition-none"
              >
                <ShareIcon />
              </Link>
              <Link
                href="/privacy"
                aria-label="Privacy and your data"
                title="Privacy and your data"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-line2 text-navy700 transition-colors duration-[var(--dur-fast)] hover:border-gold500 hover:text-gold700 motion-reduce:transition-none"
              >
                <PadlockIcon />
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
              Start now
            </Link>
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
