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
    <span className="min-w-[4.5rem] text-right text-sm text-muted" data-save-status={status}>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {status === "pending" ? (
        <span aria-hidden="true">Saving…</span>
      ) : status === "saved" ? (
        <span aria-hidden="true" className="text-success">
          ✓ Saved
        </span>
      ) : null}
    </span>
  );
}
