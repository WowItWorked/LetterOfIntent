"use client";

import { useEffect } from "react";
import { useLetterStore } from "@/lib/store";

/**
 * Runs once on the client: hydrates the persisted letter store from
 * localStorage. Hydration is deferred so the server render and the first
 * client render always match.
 *
 * Also asks the browser not to evict this origin's storage. localStorage is
 * evictable under storage pressure, and a family that loses ninety minutes
 * does not come back. The request costs one call; a denial changes nothing
 * (the backup file remains the real safety net), so it is ignored quietly.
 */
export function ClientBoot() {
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(useLetterStore.persist.rehydrate()).then(() => {
      if (!cancelled) useLetterStore.getState().markHydrated();
    });
    try {
      void navigator.storage?.persist?.().catch(() => {});
    } catch {
      // Older browsers without the Storage API — nothing to do.
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
