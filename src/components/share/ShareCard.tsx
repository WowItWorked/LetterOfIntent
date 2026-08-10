"use client";

import { shareTargets } from "@/lib/share";
import { useCopyLink } from "@/components/share/useCopyLink";
import { ShareIcon } from "@/components/ui/ShareIcon";
import { PadlockIcon } from "@/components/ui/PadlockIcon";

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
  // `share` still falls back to copying the link when the browser has no
  // native share sheet — the hook handles that internally.
  const { share } = useCopyLink();

  return (
    <div className="tw-card" style={{ boxShadow: "var(--shadow-md)" }}>
      <div
        style={{
          padding:
            "clamp(26px, 3vw, 36px) clamp(24px, 3vw, 36px) clamp(28px, 3vw, 36px)",
        }}
      >
        <p className="tw-engraved text-xs tracking-[0.16em] text-accent">
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
          <ShareIcon />
          Share to help another family
        </button>

        <div className="mt-[18px] rounded-[var(--radius-sm)] border border-line bg-paper2 px-[18px] py-4">
          <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
            A message comes written for you
          </p>
          <p className="mt-2 font-serif text-lg italic leading-[1.55] text-ink">
            &ldquo;I thought you might find this helpful. My Letter of Intent is a free
            tool for writing down what a future caregiver would need to know about someone
            you love: routines, medical details, what calms them, who to call. One small
            question at a time, and it finishes as a document you can print. Everything you
            write stays private on your own device until you choose to share it with a
            caregiver.&rdquo;
          </p>
          <p className="mt-2 text-xs text-muted">Edit or send it as it stands.</p>
        </div>

        <p className="mt-5 flex items-start gap-2.5 border-t border-line pt-[18px] text-[0.9375rem] leading-[1.7] text-muted">
          <PadlockIcon className="mt-[5px] size-[14px] fill-gold600" />
          <span className="min-w-0">
            Sharing the link reveals nothing you have written. It opens a blank letter on
            their device, the same way it opened for you.
          </span>
        </p>
      </div>
    </div>
  );
}
