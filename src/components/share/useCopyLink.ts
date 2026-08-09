"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SHARE_URL, nativeShareData } from "@/lib/share";

/**
 * Copy-link and native-share behaviour, shared by the home share card, the
 * review page card, and anywhere else the link is offered. Confirms in place
 * and reverts after a beat.
 */
export function useCopyLink() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
    } catch {
      // Clipboard blocked (insecure context, or the user declined). The link
      // is on screen either way, so there is nothing to recover from.
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2400);
  }, []);

  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share(nativeShareData);
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    await copyLink();
  }, [copyLink]);

  return { copied, copyLink, share };
}
