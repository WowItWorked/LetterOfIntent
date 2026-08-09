"use client";

import { useEffect, useRef, useState } from "react";
import { useSaveStatusStore } from "@/lib/save-status-store";

/**
 * Quiet autosave indicator. Screen-reader announcements are throttled so
 * assistive tech isn't spammed on every keystroke's debounce cycle.
 */
export function SaveIndicator() {
  const status = useSaveStatusStore((s) => s.status);
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedAt = useRef(0);

  useEffect(() => {
    if (status !== "saved") return;
    const now = Date.now();
    if (now - lastAnnouncedAt.current > 8000) {
      lastAnnouncedAt.current = now;
      setAnnouncement("Your work is saved on this device.");
      const t = setTimeout(() => setAnnouncement(""), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <span className="text-right text-[0.9375rem] text-muted" data-save-status={status}>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {status === "pending" ? (
        <span aria-hidden="true">Saving…</span>
      ) : status === "saved" ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1.5 text-success">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[13px] fill-current">
            <path d="M6.2 12.3 2.4 8.5l1.2-1.2 2.6 2.6 6-6 1.2 1.2z" />
          </svg>
          Saved
        </span>
      ) : null}
    </span>
  );
}
