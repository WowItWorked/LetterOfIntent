"use client";

import { SHARE_URL_LABEL, shareTargets } from "@/lib/share";
import { useCopyLink } from "@/components/share/useCopyLink";

const iconTile =
  "inline-flex h-[52px] w-full items-center justify-center rounded-[var(--radius-sm)] " +
  "border border-line2 text-navy700 transition-[border-color,color,transform] " +
  "duration-[var(--dur-fast)] hover:-translate-y-px hover:border-gold500 hover:text-gold700 " +
  "motion-reduce:transform-none motion-reduce:transition-none";

/**
 * The share card: eight targets with the message pre-filled, the native share
 * sheet where the browser has one, the message itself, and a copy-link row.
 *
 * Nothing here touches the letter. Every link is a static string plus the
 * public URL.
 */
export function ShareCard() {
  const { copied, copyLink, share } = useCopyLink();

  return (
    <div className="tw-card" style={{ boxShadow: "var(--shadow-md)" }}>
      <div
        style={{
          padding:
            "clamp(26px, 3vw, 36px) clamp(24px, 3vw, 36px) clamp(28px, 3vw, 36px)",
        }}
      >
        <p className="tw-engraved text-[0.6875rem] tracking-[0.24em] text-accent">
          Post it where families gather
        </p>

        <div className="mt-3 grid grid-cols-8 gap-2">
          {shareTargets.map((t) => (
            <a
              key={t.key}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.label}
              title={t.label}
              className={iconTile}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px] fill-current">
                <path d={t.path} />
              </svg>
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void share()}
          className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border-0 text-[0.9375rem] font-bold uppercase tracking-[0.1em] text-navy900 transition-[filter,transform] duration-[var(--dur-fast)] hover:-translate-y-px hover:brightness-105 motion-reduce:transform-none motion-reduce:transition-none"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-[17px] flex-none fill-none stroke-current"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4" />
            <path d="m8 8 4-4 4 4" />
            <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" />
          </svg>
          Share to help someone
        </button>

        <div className="mt-[18px] rounded-[var(--radius-sm)] border border-line bg-paper2 px-[18px] py-4">
          <p className="tw-engraved text-[0.6875rem] tracking-[0.2em] text-accent">
            A message comes written for you
          </p>
          <p className="mt-2 font-serif text-lg italic leading-[1.55] text-ink">
            &ldquo;I thought this might be useful for you. My Letter of Intent is a free
            tool for writing down what a future caregiver would need to know about someone
            you love: routines, medical details, what calms them, who to call. One small
            question at a time, and it finishes as a document you can print. Everything you
            write stays private on your own device.&rdquo;
          </p>
          <p className="mt-2 text-xs text-muted">Change a word or send it as it stands.</p>
        </div>

        <div className="mt-[22px] border-t border-line pt-5">
          <p className="tw-engraved text-[0.6875rem] tracking-[0.24em] text-accent">
            Or copy the link and send it yourself
          </p>
          <div className="mt-3 flex items-stretch overflow-hidden rounded-[var(--radius-sm)] border border-gold400 bg-gold100">
            <span className="flex min-w-0 flex-1 items-center overflow-hidden text-ellipsis whitespace-nowrap px-4 font-serif text-[clamp(1.05rem,2.2vw,1.3rem)] tracking-[0.01em] text-ink">
              {SHARE_URL_LABEL}
            </span>
            <button
              type="button"
              onClick={() => void copyLink()}
              aria-label="Copy the link"
              className="min-h-[54px] flex-none border-0 border-l border-gold400 bg-transparent px-[18px] text-xs font-bold uppercase tracking-[0.12em] text-gold700 transition-colors duration-[var(--dur-fast)] hover:bg-gold200 hover:text-navy800 motion-reduce:transition-none"
            >
              <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
            </button>
          </div>
        </div>

        <p className="mt-5 border-t border-line pt-[18px] text-[0.9375rem] leading-[1.7] text-muted">
          Sharing the link reveals nothing you have written. It opens a blank letter on
          their device, the same way it opened for you.
        </p>
      </div>
    </div>
  );
}
