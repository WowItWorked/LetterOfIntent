"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { firm } from "@/config/firm";
import { serializeBackup } from "@/lib/backup";
import { sectionsForMeta, startedCount } from "@/lib/content/config";
import { requirementsMet } from "@/lib/cards/derive";
import { CARD_KEYS } from "@/lib/content/cards";
import { documentFilename } from "@/lib/filenames";
import { triggerDownload } from "@/lib/download";
import { deleteAllPhotos, photosForBackup } from "@/lib/photos";
import { LETTER_STORAGE_KEY, useLetterStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RestoreFlow } from "@/components/data/RestoreFlow";
import { useCardPack } from "@/components/cards/card-pack";

type Notice = { tone: "success" | "danger"; text: string } | null;

/**
 * Each card is laid out explanation-left, actions-right, so the buttons line
 * up down the page and the reading column keeps its measure.
 */
function ActionCard({
  eyebrow,
  title,
  children,
  actions,
  danger,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        danger
          ? "mt-[22px] overflow-hidden rounded-[var(--radius-md)] border border-danger bg-surface"
          : "tw-card mt-[22px]"
      }
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]"
        style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}
      >
        <div className="min-w-0 flex-[3_1_340px]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-2 font-serif text-[1.75rem] font-semibold text-ink">{title}</h2>
          <div className="mt-2.5 max-w-[66ch] leading-[1.7]">{children}</div>
        </div>
        <div className="flex min-w-0 flex-[1_1_250px] flex-col gap-3">{actions}</div>
      </div>
    </section>
  );
}

export function DataControls() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const clearAll = useLetterStore((s) => s.clearAll);

  const [notice, setNotice] = useState<Notice>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState<"letter" | "emergency" | "cards" | null>(null);
  const [cardProgress, setCardProgress] = useState("");
  // The card pack needs its cards mounted to rasterize them; `pack.host` at
  // the foot of this component is where that happens.
  const pack = useCardPack();
  const cardsReady = hydrated && CARD_KEYS.some((k) => requirementsMet(data, k));

  const total = sectionsForMeta(meta, data).length;
  const count = hydrated ? startedCount(data, meta) : 0;

  /* ------------------------------------------------------------- export */
  const handleExport = async () => {
    const photos = await photosForBackup();
    // The routing answers travel in meta, so a restore re-fits the form
    // without asking the family anything.
    triggerDownload(
      documentFilename("backup"),
      serializeBackup(data, meta, photos),
      "application/json"
    );
    setNotice({
      tone: "success",
      text:
        "Backup downloaded. Keep it somewhere safe: a cloud drive, an email to " +
        "yourself, a USB stick." +
        (photos.length ? ` Your ${photos.length === 1 ? "photo is" : "photos are"} inside it too.` : ""),
    });
  };

  const handleDocument = async (kind: "letter" | "emergency") => {
    setBusy(kind);
    setNotice(null);
    try {
      const mod = await import("@/lib/pdf/generate");
      if (kind === "letter") {
        const blob = await mod.generateLetterPdfBlob(data, meta);
        triggerDownload(mod.letterPdfFilename(), blob, "application/pdf");
      } else {
        const blob = await mod.generateEmergencyPdfBlob(data);
        triggerDownload(mod.emergencyPdfFilename(), blob, "application/pdf");
      }
    } catch (e) {
      console.error(e);
      setNotice({
        tone: "danger",
        text: "That document couldn't be prepared on this device. The reading view on the review page still prints.",
      });
    } finally {
      setBusy(null);
    }
  };

  /** The eight card images as one archive — see ReviewScreen for the why. */
  const handleCards = async () => {
    setBusy("cards");
    setNotice(null);
    try {
      const entries = await pack.buildEntries((done, all) =>
        setCardProgress(done < all ? `${Math.min(done + 1, all)} of ${all}…` : "")
      );
      const { createZipBlob } = await import("@/lib/zip");
      triggerDownload(
        documentFilename("cards"),
        createZipBlob(entries, new Date()),
        "application/zip"
      );
      setNotice({
        tone: "success",
        text:
          `${entries.length} card images downloaded as a zip. Unzip it and save the ` +
          "images to your photos, so you can send one from your phone without opening " +
          "this site.",
      });
    } catch (e) {
      console.error(e);
      setNotice({
        tone: "danger",
        text: "The cards couldn't be drawn on this device. The Care cards page can still send them one at a time.",
      });
    } finally {
      setCardProgress("");
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------- delete */
  const handleDelete = async () => {
    clearAll();
    useLetterStore.persist.clearStorage();
    await deleteAllPhotos();
    setDeleteOpen(false);
    const letterGone = localStorage.getItem(LETTER_STORAGE_KEY) === null;
    setNotice(
      letterGone
        ? {
            tone: "success",
            text: "Deleted. We checked: this device now holds nothing from this tool.",
          }
        : {
            tone: "danger",
            text: "Something didn't clear. Please also clear this site's data in your browser settings.",
          }
    );
  };

  return (
    <div>
      <div aria-live="polite">
        {notice ? (
          <p
            className={
              notice.tone === "success"
                ? "mt-[22px] rounded-[var(--radius-md)] border border-success/40 bg-successbg p-4 text-success"
                : "mt-[22px] rounded-[var(--radius-md)] border border-danger bg-dangerbg p-4 text-danger"
            }
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------- backup */}
      <ActionCard
        eyebrow="Keep a copy"
        // One noun for this thing, everywhere: "backup file". The card used to
        // say "a backup" while its own button said "backup file", which asks a
        // tired reader to work out whether those are the same object. They are
        // the one thing standing between them and total loss of the letter.
        title="Download your backup file"
        actions={
          <Button onClick={() => void handleExport()} disabled={!hydrated}>
            Download backup file
          </Button>
        }
      >
        <p>
          One file holds your whole letter
          {count > 0 ? ` (${count} of ${total} sections have notes)` : ""}, photographs
          included. Keep it in a safe place, move it to another device, or email it to
          yourself. If this browser&rsquo;s data is ever cleared, the backup file is how
          you get everything back.
        </p>
        <div className="mt-4 rounded-[var(--radius-sm)] border border-gold400 bg-gold100 px-4 py-3.5 text-[0.9375rem] leading-[1.7]">
          <strong className="font-semibold text-ink">There is no online account</strong>, so
          there is nothing for us to restore for you. This file is the only copy that
          outlives this browser.
        </div>
        <p className="mt-3 text-[0.9375rem] text-muted">
          The <code className="font-sans">.json</code> file is written for the builder to
          read, not for a person. The documents below are the ones you hand to someone.
        </p>
      </ActionCard>

      {/* ---------------------------------------------------- documents */}
      <ActionCard
        eyebrow="For the people who help"
        title="Download the documents"
        actions={
          <>
            <Button onClick={() => void handleDocument("letter")} disabled={!hydrated || busy !== null}>
              {busy === "letter" ? "Preparing…" : "The letter (PDF)"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDocument("emergency")}
              disabled={!hydrated || busy !== null}
            >
              {busy === "emergency" ? "Preparing…" : "Emergency sheet (PDF)"}
            </Button>
            {cardsReady ? (
              <Button
                variant="outline"
                onClick={() => void handleCards()}
                disabled={!hydrated || busy !== null || !pack.ready}
              >
                {busy === "cards"
                  ? `Preparing… ${cardProgress}`
                  : pack.ready
                    ? `Care cards (${pack.fileCount} PNGs, zip)`
                    : "Preparing…"}
              </Button>
            ) : null}
          </>
        }
      >
        <p>
          The same documents the review page produces: the full Letter of Intent, the
          one-page emergency sheet, and your care cards. All of them are built here on
          this device, from whatever you have written so far.
        </p>
        <p className="mt-3">
          The cards come as PNG images in a zip rather than a document, because that is
          what makes them useful: unzip them into your photos and you can send one from
          your phone without opening this site.
        </p>
        <p className="mt-3 text-[0.9375rem] text-muted">
          Prefer to see it all first?{" "}
          <Link href="/letter/review" className="underline underline-offset-[3px]">
            Go to review &amp; download
          </Link>
          .
        </p>
      </ActionCard>

      {/* ------------------------------------------------------- import */}
      <ActionCard
        eyebrow="Continue elsewhere"
        title="Load a backup file"
        actions={<RestoreFlow onNotice={setNotice} />}
      >
        <p>
          Continue on this device from a backup file you downloaded earlier, here or on
          another device. That is the <code className="font-sans">.json</code> file this
          tool gave you &mdash; not one of the PDFs, which are for reading rather than
          reloading. Loading a backup file replaces whatever is on this device, so
          download a copy of that first if you want to keep it.
        </p>
        <p className="mt-3 text-[0.9375rem] text-muted">
          Backup files from earlier releases load cleanly: everything they hold comes
          forward into the letter, and anything unreadable is reported rather than
          silently dropped.
        </p>
      </ActionCard>

      {/* ------------------------------------------------------- delete */}
      <ActionCard
        danger
        eyebrow="Erase"
        title="Delete all my data"
        actions={
          <Button variant="danger" onClick={() => setDeleteOpen(true)} disabled={!hydrated}>
            Delete all my data…
          </Button>
        }
      >
        <p>
          Erases everything this tool has stored on this device: the whole letter and any
          photographs. This cannot be undone, and there is no copy anywhere else. If you
          might want the letter later, download a backup first.
        </p>
      </ActionCard>

      <p className="mt-8 text-[0.9375rem] text-muted">
        Wondering where your data lives in the first place?{" "}
        <Link href="/privacy" className="underline underline-offset-[3px]">
          How your data works
        </Link>
        {" · "}
        Questions? Call {firm.shortName} at{" "}
        <a href={firm.phoneHref} className="underline underline-offset-[3px]">
          {firm.phone}
        </a>{" "}
        or write to{" "}
        <a href={`mailto:${firm.email}`} className="underline underline-offset-[3px]">
          {firm.email}
        </a>
        .
      </p>

      {/* ------------------------------------------------- delete dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete everything on this device?"
      >
        <p className="max-w-[66ch] text-body">
          Your whole letter
          {count > 0 ? ` (including the ${count} sections with notes)` : ""} will be
          permanently erased from this device, along with any photographs. There is no
          undo.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => void handleDelete()}>
            Yes, delete it all
          </Button>
          <Button variant="outline" onClick={() => void handleExport()}>
            Download a backup first
          </Button>
          <Button variant="quiet" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>

      {/* The card pipeline's offscreen host — machinery, not content. */}
      {pack.host}
    </div>
  );
}
