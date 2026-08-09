"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPTED_TYPES,
  MAX_PHOTO_BYTES,
  type PhotoSlot,
  type StoredPhoto,
  deletePhoto,
  getPhoto,
  isSupported,
  putPhoto,
  setCaption,
  sniffImageType,
} from "@/lib/photos";

const SLOTS: Array<{
  slot: PhotoSlot;
  eyebrow: string;
  placeholder: string;
  caption: string;
}> = [
  {
    slot: "recent",
    eyebrow: "Recent photo",
    placeholder: "Add a recent photo of {name}",
    caption: "Prints on the emergency sheet. A clear face, taken this year.",
  },
  {
    slot: "family",
    eyebrow: "Family or other photo",
    placeholder: "Add a family photo",
    caption: "Their people, their room, a place that matters. Caption it below.",
  },
];

function humanSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * The two photo drop targets. Images are held in IndexedDB on this device and
 * are never uploaded — but they are also the one thing a browser data purge
 * would take with it, hence the standing nudge to download a backup.
 */
export function PhotoFields({ name }: { name: string }) {
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, StoredPhoto>>>({});
  const [urls, setUrls] = useState<Partial<Record<PhotoSlot, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaptionText] = useState("");
  const [supported, setSupported] = useState(true);
  const captionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const objectUrls = useRef<string[]>([]);

  const show = useCallback((slot: PhotoSlot, record: StoredPhoto | undefined) => {
    setPhotos((p) => ({ ...p, [slot]: record }));
    setUrls((u) => {
      if (u[slot]) URL.revokeObjectURL(u[slot]!);
      if (!record) return { ...u, [slot]: undefined };
      const url = URL.createObjectURL(record.blob);
      objectUrls.current.push(url);
      return { ...u, [slot]: url };
    });
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      // Deferred rather than checked in the effect body: on the server there
      // is no indexedDB, and flipping this synchronously would swap the panel
      // out underneath the first paint.
      if (!isSupported()) {
        if (live) setSupported(false);
        return;
      }
      const [r, f] = await Promise.all([getPhoto("recent"), getPhoto("family")]);
      if (!live) return;
      if (r) show("recent", r);
      if (f) {
        show("family", f);
        setCaptionText(f.caption ?? "");
      }
    })();
    const urlsAtMount = objectUrls.current;
    return () => {
      live = false;
      urlsAtMount.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [show]);

  const accept = async (slot: PhotoSlot, file: File | undefined) => {
    if (!file) return;
    // Size first — cheapest check, and it bounds everything after it.
    if (file.size > MAX_PHOTO_BYTES) {
      setError(
        `That photo is ${humanSize(file.size)}. Please pick one under ${humanSize(
          MAX_PHOTO_BYTES
        )} — most phones can email or export a smaller copy.`
      );
      return;
    }

    // Trust the bytes, not the name or the reported type. A renamed SVG would
    // otherwise pass, and an SVG is a document that can carry script.
    const sniffed = await sniffImageType(file);
    if (!sniffed) {
      setError(
        "That file is not a photograph the tool can read. JPEG, PNG, WebP, and HEIC " +
          "all work — most phone photos are one of those already."
      );
      return;
    }

    setError(null);
    try {
      const record = await putPhoto(slot, file, slot === "family" ? caption : undefined);
      show(slot, record);
    } catch {
      setError(
        "This browser would not store the photo. It may be in private mode, or out of space."
      );
    }
  };

  const remove = async (slot: PhotoSlot) => {
    await deletePhoto(slot);
    show(slot, undefined);
    if (slot === "family") setCaptionText("");
  };

  const onCaption = (value: string) => {
    setCaptionText(value);
    clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => void setCaption("family", value), 600);
  };

  if (!supported) {
    return (
      <p className="max-w-[66ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4 text-[0.9375rem] text-muted">
        This browser cannot store photographs on the device, so that part is switched
        off. Everything else in the letter works normally.
      </p>
    );
  }

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="p-0 font-semibold text-ink">Photographs</legend>
      <p className="mt-1.5 max-w-[66ch] text-[0.9375rem] text-muted">
        Two photos, and no more. The first is a recent photo of {name}; it prints on the
        emergency sheet so a sitter, a school nurse, or an ER team recognizes them
        straight away. The second is a family or other photo for the letter itself.
      </p>

      <div
        className="mt-3.5 grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}
      >
        {SLOTS.map((s) => {
          const url = urls[s.slot];
          const record = photos[s.slot];
          return (
            <figure key={s.slot} className="m-0">
              <div
                className="relative w-full overflow-hidden rounded-[var(--radius-sm)] border border-line bg-surface"
                style={{ aspectRatio: "4 / 5" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void accept(s.slot, e.dataTransfer.files?.[0]);
                }}
              >
                {url ? (
                  // The image is a local object URL for a file the family picked;
                  // next/image would only add an optimizer round trip.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={
                      s.slot === "recent"
                        ? `Recent photograph of ${name}`
                        : caption || "Family photograph"
                    }
                    className="size-full object-cover"
                  />
                ) : null}

                <label
                  className={
                    url
                      ? "absolute bottom-0 left-0 right-0 flex min-h-11 cursor-pointer items-center justify-center bg-[rgba(22,34,58,0.78)] text-xs font-semibold uppercase tracking-[0.09em] text-onink"
                      : "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center text-[0.9375rem] text-muted hover:bg-paper2"
                  }
                >
                  {url ? "Replace" : s.placeholder.replace("{name}", name)}
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="sr-only"
                    onChange={(e) => {
                      void accept(s.slot, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <figcaption className="mt-2 text-xs leading-[1.5] text-muted">
                <span className="tw-engraved block text-[9px] tracking-[0.16em] text-accent">
                  {s.eyebrow}
                </span>
                {s.caption}
                {record ? (
                  <button
                    type="button"
                    onClick={() => void remove(s.slot)}
                    className="mt-1.5 block min-h-11 text-xs font-semibold uppercase tracking-[0.08em] text-danger underline-offset-4 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="mt-3">
        <label htmlFor="photo-caption" className="block text-[0.9375rem] font-semibold text-ink">
          Caption for the second photo
        </label>
        <input
          id="photo-caption"
          type="text"
          value={caption}
          onChange={(e) => onCaption(e.target.value)}
          placeholder="Left to right: Alex, his sister Nora, and their grandmother"
          className="mt-2 min-h-11 w-full rounded-[var(--radius-sm)] border border-control bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-faint focus:border-gold400 focus:outline-none focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 max-w-[66ch] rounded-[var(--radius-sm)] border border-danger bg-dangerbg p-3 text-[0.9375rem] text-danger"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-3 max-w-[66ch] text-xs leading-[1.6] text-faint">
        Photos stay on this device with the rest of your letter, and they are never
        uploaded. Because images are large,{" "}
        <Link href="/your-data" className="underline underline-offset-[3px]">
          download a backup file
        </Link>{" "}
        after adding them.
      </p>
    </fieldset>
  );
}
