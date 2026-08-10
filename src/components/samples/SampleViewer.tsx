"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Renders a sample PDF onto canvases with pdf.js.
 *
 * Linking straight at the .pdf looked simpler, but whether it opens or lands
 * in the downloads folder is a per-browser setting we do not control — Chrome
 * has a "download PDFs instead of opening them" preference that is on for a
 * lot of people, and a prospective family clicking "see a sample" should not
 * get a file to manage. Drawing it ourselves makes the outcome the same
 * everywhere, and the real PDF is still one click away underneath.
 *
 * The worker is served from /public rather than resolved through the bundler,
 * so the path is deterministic and stays inside `worker-src 'self'`. It is
 * copied from node_modules — see scripts/sync-pdf-worker.mjs.
 */

const WORKER_SRC = "/pdf.worker.min.mjs";
/** Wider than any screen we target; the canvas is scaled down by CSS. */
const RENDER_WIDTH = 1100;

type Status = "loading" | "ready" | "failed";

export function SampleViewer({
  file,
  title,
  subtitle,
  note,
}: {
  file: string;
  title: string;
  subtitle: string;
  note?: string;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [pageCount, setPageCount] = useState(0);
  const [rendered, setRendered] = useState(0);
  const holder = useRef<HTMLDivElement>(null);

  const draw = useCallback(async () => {
    const el = holder.current;
    if (!el) return;

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

      const doc = await pdfjs.getDocument({ url: file }).promise;
      setPageCount(doc.numPages);
      el.replaceChildren();

      for (let n = 1; n <= doc.numPages; n += 1) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className =
          "block h-auto w-full rounded-[var(--radius-sm)] border border-line bg-white";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `${title}, page ${n} of ${doc.numPages}`);

        const wrap = document.createElement("figure");
        wrap.className = "m-0 mb-6";
        wrap.style.boxShadow = "var(--shadow-md)";
        wrap.appendChild(canvas);
        el.appendChild(wrap);

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        setRendered(n);
      }
      setStatus("ready");
    } catch {
      setStatus("failed");
    }
  }, [file, title]);

  useEffect(() => {
    // Client-side navigation lands here mid-scroll: this segment is a lazily
    // loaded client component, so at the moment the router runs its
    // scroll-to-top there is nothing mounted to scroll to, and the previous
    // page's position survives. Every arrival at a sample should start at the
    // masthead, so reset it ourselves once the viewer exists.
    window.scrollTo(0, 0);

    // Deferred to a microtask: `draw` sets state as each page finishes, and
    // calling it straight from the effect body would be a synchronous setState
    // in an effect.
    let live = true;
    void Promise.resolve().then(() => {
      if (live) return draw();
    });
    return () => {
      live = false;
    };
  }, [draw]);

  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "var(--container)",
        padding: "clamp(28px, 4vw, 52px) var(--gutter) 72px",
      }}
    >
      <div
        className="rounded-[var(--radius-md)]"
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          boxShadow: "var(--shadow-md)",
          padding: "clamp(24px, 3vw, 36px) clamp(24px, 3.4vw, 44px)",
        }}
      >
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
          Sample document
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.6rem,4.5vw,2.5rem)] font-semibold tracking-[-0.015em] text-onink">
          {title}
        </h1>
        <p className="mt-3 max-w-[66ch] text-lg leading-[1.7] text-oninkbody">{subtitle}</p>

        {note ? (
          <p className="mt-5 flex max-w-[70ch] items-start gap-3 rounded-[var(--radius-sm)] border border-gold500 bg-[rgba(255,255,255,0.06)] px-5 py-4 text-[0.9375rem] leading-[1.7] text-onink">
            <span className="tw-diamond mt-2 flex-none" aria-hidden="true" />
            <span>{note}</span>
          </p>
        ) : null}

        <p className="mt-4 border-t border-navy500 pt-4 text-[0.9375rem] text-oninkbody">
          Every name, diagnosis, and phone number here is invented. The pages are marked
          SAMPLE so this is never mistaken for a real family&rsquo;s letter.
        </p>
        {/* Equal columns: two calls to action of different label lengths look
            like one is the real choice when they are sized by their text. */}
        <div
          className="mt-5 grid max-w-[520px] gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
        >
          <a
            href={file}
            download
            className={buttonClasses("accent", "w-full px-4 text-center", "md")}
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
          >
            Download this PDF
          </a>
          <Link
            href="/letter"
            className={buttonClasses("outlineOnInk", "w-full px-4 text-center tracking-[0.06em]")}
          >
            Start your own letter
          </Link>
        </div>
      </div>

      <div aria-live="polite" className="mt-8">
        {status === "loading" ? (
          <p className="text-muted">
            Preparing the sample{pageCount ? ` — page ${rendered} of ${pageCount}` : ""}…
          </p>
        ) : null}
        {status === "failed" ? (
          <p className="max-w-[66ch] rounded-[var(--radius-sm)] border border-danger bg-dangerbg p-4 text-danger">
            Sorry — the preview could not be drawn in this browser.{" "}
            <a href={file} className="font-semibold underline underline-offset-[3px]">
              Open the PDF directly
            </a>{" "}
            instead.
          </p>
        ) : null}
      </div>

      <div ref={holder} className="mt-6" />

      {status === "ready" ? (
        <p className="mt-2 text-[0.9375rem] text-muted">
          {pageCount} page{pageCount === 1 ? "" : "s"}. This is what the builder produces
          from a part-finished letter.
        </p>
      ) : null}
    </div>
  );
}
