"use client";

import { useEffect } from "react";
import { useLetterStore } from "@/lib/store";

/**
 * Runs once on the client: hydrates the persisted letter store from
 * localStorage. Hydration is deferred so the server render and the first
 * client render always match.
 */
export function ClientBoot() {
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(useLetterStore.persist.rehydrate()).then(() => {
      if (!cancelled) useLetterStore.getState().markHydrated();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
