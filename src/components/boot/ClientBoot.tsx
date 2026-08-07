"use client";

import { useEffect } from "react";
import { useLetterStore } from "@/lib/store";
import { applySettingsToDocument, useSettingsStore } from "@/lib/settings-store";

/**
 * Runs once on the client: hydrates both persisted stores from localStorage
 * (hydration is deferred so server and first client render always match),
 * then keeps display settings applied to <html>.
 */
export function ClientBoot() {
  useEffect(() => {
    let cancelled = false;

    Promise.resolve(useSettingsStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      const { textSize, contrast } = useSettingsStore.getState();
      applySettingsToDocument(textSize, contrast);
    });

    Promise.resolve(useLetterStore.persist.rehydrate()).then(() => {
      if (!cancelled) useLetterStore.getState().markHydrated();
    });

    const unsub = useSettingsStore.subscribe((s) =>
      applySettingsToDocument(s.textSize, s.contrast)
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return null;
}
