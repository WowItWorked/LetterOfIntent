"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { triggerDownload } from "@/lib/download";
import { blankFormFilename } from "@/lib/filenames";
import type { BlankFormKind } from "@/lib/pdf/generate";

/**
 * The three blank forms, built on the device when the button is pressed.
 *
 * @react-pdf/renderer is imported dynamically for the same reason the review
 * screen does it: it is the heaviest dependency in the app, and a visitor who
 * only reads this page should never pay for it.
 */

interface FormDef {
  kind: BlankFormKind;
  title: string;
  blurb: string;
}

const FORMS: readonly FormDef[] = [
  {
    kind: "letter",
    title: "The Letter of Intent",
    blurb:
      "The deep document, written for the trustee: the person, the money, the benefits, the legal picture, and the judgment calls nobody else can make for you.",
  },
  {
    kind: "caregiver",
    title: "The Letter for the Caregiver",
    blurb:
      "The day-to-day letter, for whoever gives the care: routines, communication, behavior, and health as it is actually lived.",
  },
  {
    kind: "emergency",
    title: "The Emergency Information Sheet",
    blurb:
      "One page for the fridge, the school office, the sitter, and the ER: conditions, medications, allergies, how they communicate, and who to call first.",
  },
];

export function FillableFormDownloads() {
  const [busy, setBusy] = useState<BlankFormKind | null>(null);
  const [failed, setFailed] = useState<BlankFormKind | null>(null);

  async function download(kind: BlankFormKind) {
    setBusy(kind);
    setFailed(null);
    try {
      const { generateBlankFormPdfBlob } = await import("@/lib/pdf/generate");
      triggerDownload(blankFormFilename(kind), await generateBlankFormPdfBlob(kind));
    } catch (err) {
      // The reader gets a calm sentence; the console gets the cause. Without
      // this the only symptom of a broken renderer is a polite failure
      // message, which is indistinguishable from a browser that blocked the
      // download — and no way to tell which from a bug report.
      console.error("Fillable form failed to build", kind, err);
      setFailed(kind);
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul
      className="mt-10 grid list-none gap-6 p-0"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}
    >
      {FORMS.map((form) => (
        <li key={form.kind} className="flex">
          <div
            className="tw-card flex flex-1 flex-col p-[clamp(20px,2.6vw,28px)]"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <h3 className="font-serif text-[1.3rem] font-semibold leading-snug text-ink">
              {form.title}
            </h3>
            <p className="mt-2 text-[0.9375rem] leading-[1.7] text-body">{form.blurb}</p>
            {/* mt-auto pins the button to the bottom, so the three end level
                whatever their copy does. */}
            <div className="mt-auto pt-5">
              <Button
                className="w-full"
                onClick={() => void download(form.kind)}
                disabled={busy !== null}
              >
                {busy === form.kind ? "Building the form…" : "Download PDF"}
              </Button>
              {failed === form.kind ? (
                <p role="alert" className="mt-2.5 text-[0.875rem] leading-[1.5] text-danger">
                  That did not build. Reload the page and try once more — nothing was
                  sent anywhere, so nothing is lost.
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
