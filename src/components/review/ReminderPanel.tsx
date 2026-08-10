"use client";

import { useState } from "react";
import { firm } from "@/config/firm";

/** Good enough to tell a typo from an address; the server would do the rest. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Option two: the emailed yearly reminder.
 *
 * The panel is built, but the sending side is not switched on yet — there is
 * no endpoint, no list, and nothing to schedule a send from a year out. So it
 * says so, before anyone types an address, and the submit hands people back to
 * the calendar option rather than pretending to have signed them up. Nothing
 * is stored and nothing is transmitted.
 */
export function ReminderPanel() {
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);

  const valid = LOOKS_LIKE_EMAIL.test(email.trim());

  return (
    <div
      className="rounded-[var(--radius-sm)] border border-navy700 px-6 pb-6 pt-[22px]"
      style={{
        background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 84%)",
      }}
    >
      <p className="tw-engraved text-xs tracking-[0.15em] text-gold400">
        Option two · not switched on yet
      </p>
      <h3 className="mt-2 font-serif text-[1.375rem] font-semibold text-onink">
        Let us remind you
      </h3>
      <p className="mt-2.5 text-[0.9375rem] leading-[1.7] text-oninkbody">
        One day {firm.shortName} will send a single email, one year from today, reminding
        you to update your documents. One email, not a newsletter.{" "}
        <strong className="font-semibold text-onink">
          That service is not running yet
        </strong>
        , so for now please use the calendar reminder beside this.
      </p>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
        }}
      >
        <label
          htmlFor="reminder-email"
          className="block text-[0.9375rem] font-semibold text-onink"
        >
          Your email address
        </label>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <input
            id="reminder-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTried(false);
            }}
            aria-describedby="reminder-note"
            // No focus:outline-none — the global two-tone ring is the focus
            // indicator, and this field sits on a navy panel where the old
            // soft-gold shadow was the least visible of all.
            className="min-h-[46px] min-w-0 flex-[1_1_200px] rounded-[var(--radius-sm)] border border-navy500 bg-white px-3.5 py-2.5 text-base text-ink focus:border-gold500"
          />
          <button
            type="submit"
            className={
              valid
                ? "min-h-[46px] rounded-[var(--radius-sm)] border-0 px-5 text-[0.9375rem] font-semibold uppercase tracking-[0.06em] text-navy900"
                : "min-h-[46px] rounded-[var(--radius-sm)] border border-navy500 bg-[rgba(255,255,255,0.08)] px-5 text-[0.9375rem] font-semibold uppercase tracking-[0.06em] text-oninkmuted"
            }
            style={valid ? { background: "var(--gradient-gold)" } : undefined}
          >
            Send me the reminder
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {tried ? (
          <p className="mt-3.5 rounded-[var(--radius-sm)] border border-gold500 bg-[rgba(255,255,255,0.06)] p-4 text-[0.9375rem] leading-[1.7] text-onink">
            Email reminders aren&rsquo;t switched on yet, so nothing was sent and your
            address was not saved or transmitted anywhere. Use one of the calendar
            buttons instead — they work today, and they never involve an email address at
            all.
          </p>
        ) : null}
      </div>

      <p id="reminder-note" className="mt-3.5 text-xs leading-[1.7] text-oninkmuted">
        When it does run, the only thing sent will be{" "}
        <strong className="font-semibold text-onink">your email address</strong>, not a
        word of your letter — used for that one reminder, with an unsubscribe link on it.
      </p>
    </div>
  );
}
