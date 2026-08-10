"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_FILE = "/what-is-a-letter-of-intent.mp4";
/**
 * Byte-identical to /mloi-lockup-stacked.png today, and deliberately kept as
 * its own file: that one is the document lockup on the PDF covers
 * (firm.appLogoPath). Pointing both at one asset would mean swapping in a real
 * video still one day silently restyled every letter a family has printed.
 */
const POSTER = "/video-poster-lockup.png";
const POSITION_KEY = "mloi.video.whatIsALetterOfIntent.position";

/** Don't resume within this many seconds of the end — that's a finished view. */
const END_MARGIN = 5;
/** Throttle for writing the position back to localStorage. */
const SAVE_EVERY_MS = 2000;

/**
 * The explainer video. The whole poster is a button; clicking anywhere starts
 * playback.
 *
 * Seeking depends on the host answering range requests. Vercel does, so the
 * blob fallback below should never fire in production — it is here for hosts
 * that don't, where an un-seekable timeline would make the video useless to
 * anyone who wants to skip back over a sentence.
 */
export function VideoPlayer() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [src, setSrc] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrl = useRef<string | null>(null);
  const blobTried = useRef(false);
  const lastSave = useRef(0);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    []
  );

  /* --------------------------------------------------------------- seeking */
  const ensureSeekable = useCallback(() => {
    const v = videoRef.current;
    if (!v || blobTried.current) return;
    const rangeServed =
      v.seekable.length > 0 && v.duration > 0 && v.seekable.end(0) > v.duration - 1;
    if (rangeServed) return;

    blobTried.current = true;
    setLoading(true);
    const at = v.currentTime;
    fetch(VIDEO_FILE)
      .then((r) => r.blob())
      .then((b) => {
        objectUrl.current = URL.createObjectURL(b);
        setSrc(objectUrl.current);
        setLoading(false);
        // The <video> keeps its identity across the src swap, so pick up where
        // the streamed copy left off.
        const nv = videoRef.current;
        if (!nv) return;
        const go = () => {
          nv.currentTime = at;
          void nv.play().catch(() => {});
        };
        if (nv.readyState >= 1) go();
        else nv.addEventListener("loadedmetadata", go, { once: true });
      })
      .catch(() => setLoading(false));
  }, []);

  /* ----------------------------------------------------------------- start */
  const start = useCallback(() => {
    setPlaying(true);
    setSrc((s) => s || VIDEO_FILE);
  }, []);

  // Runs once the <video> is on the page with a source.
  const attach = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (!el || el.dataset.started === "1") return;
      el.dataset.started = "1";

      const saved = Number(localStorage.getItem(POSITION_KEY) || 0);
      const resume = () => {
        if (saved > 3 && el.duration && saved < el.duration - END_MARGIN) {
          el.currentTime = saved;
        }
      };
      if (el.readyState >= 1) resume();
      else el.addEventListener("loadedmetadata", resume, { once: true });

      void el.play().catch(() => {});
      el.addEventListener("canplay", ensureSeekable, { once: true });
    },
    [ensureSeekable]
  );

  /* -------------------------------------------------------------- controls */
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || v.paused) return;
    const now = Date.now();
    if (now - lastSave.current < SAVE_EVERY_MS) return;
    lastSave.current = now;
    try {
      localStorage.setItem(POSITION_KEY, String(Math.floor(v.currentTime)));
    } catch {
      // Storage full or blocked — losing the resume point is not worth an error.
    }
  };

  const onClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const v = videoRef.current;
    if (!v) return;
    // Leave the bottom strip to the browser's own scrub bar.
    if (e.clientY > v.getBoundingClientRect().bottom - 58) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLVideoElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const step = e.shiftKey ? 30 : 5;
    const k = e.key;
    if (k === " " || k === "k") {
      e.preventDefault();
      if (v.paused) void v.play().catch(() => {});
      else v.pause();
    } else if (k === "ArrowRight" || k === "l") {
      e.preventDefault();
      v.currentTime = Math.min(v.duration || 0, v.currentTime + step);
    } else if (k === "ArrowLeft" || k === "j") {
      e.preventDefault();
      v.currentTime = Math.max(0, v.currentTime - step);
    } else if (k === "Home") {
      e.preventDefault();
      v.currentTime = 0;
    } else if (k === "End" && v.duration) {
      e.preventDefault();
      v.currentTime = v.duration - 0.1;
    } else if (k >= "0" && k <= "9" && v.duration) {
      e.preventDefault();
      v.currentTime = v.duration * (Number(k) / 10);
    }
  };

  return (
    <figure className="mt-10">
      <div
        className="relative w-full overflow-hidden rounded-[var(--radius-md)] border border-line bg-white"
        style={{ aspectRatio: "16 / 9", boxShadow: "var(--shadow-md)" }}
      >
        {!playing ? (
          <button
            type="button"
            onClick={start}
            aria-label="Play the video: what a Letter of Intent is, and how the builder works"
            className="absolute inset-0 block size-full cursor-pointer border-0 bg-white p-0 transition-colors duration-[var(--dur-fast)] hover:bg-paper motion-reduce:transition-none"
          >
            <Image
              src={POSTER}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 560px"
              className="box-border object-contain p-[5%]"
              priority={false}
            />
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 flex h-[52%] w-[42%] items-center justify-center"
            >
              <span
                className="inline-flex items-center gap-[9px] rounded-full bg-navy800 py-[7px] pl-[7px] pr-4"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                <span
                  className="flex size-[30px] flex-none items-center justify-center rounded-full"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  <svg viewBox="0 0 24 24" className="ml-0.5 size-[13px] fill-navy900">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.09em] text-onink">
                  Watch
                </span>
              </span>
            </span>
          </button>
        ) : null}

        {playing && src ? (
          // No caption track: the same explanation is written out in full in
          // the column beside this player.
          <video
            ref={attach}
            src={src}
            poster={POSTER}
            controls
            playsInline
            preload="auto"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={onKeyDown}
            onTimeUpdate={onTimeUpdate}
            className="absolute inset-0 size-full bg-navy900 object-contain outline-offset-2"
          />
        ) : null}

        {loading ? (
          <div
            aria-live="polite"
            className="absolute left-3 top-3 flex items-center gap-2.5 rounded-full px-3.5 py-[7px] backdrop-blur-[6px]"
            style={{ background: "rgba(16,25,42,0.86)" }}
          >
            <span
              aria-hidden="true"
              className="block h-0.5 w-[34px] overflow-hidden"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <span
                className="block h-full w-[45%] motion-reduce:animate-none"
                style={{
                  background: "var(--gradient-gold)",
                  animation: "mloi-load 1.1s var(--ease-out) infinite",
                }}
              />
            </span>
            <span className="tw-engraved text-xs tracking-[0.16em] text-gold300">
              Preparing to scrub
            </span>
          </div>
        ) : null}
      </div>

      <figcaption className="mt-[18px]">
        <p className="tw-engraved text-xs tracking-[0.2em] text-gold300">
          Watch · under 5 minutes
        </p>
        <p className="mt-2 font-serif text-[1.375rem] leading-[1.35] text-onink">
          What a Letter of Intent is, and how the builder works.
        </p>
        <p className="mt-2 text-[0.9375rem] text-navy300">
          The video walks through what to write, why it matters, and how to finish it in
          ten-minute sittings.
        </p>
      </figcaption>
    </figure>
  );
}
