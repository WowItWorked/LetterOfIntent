import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const SETTINGS_STORAGE_KEY = "twl-loi-settings-v1";

export type TextSize = 1 | 2 | 3;
export type Contrast = "default" | "high";

interface SettingsState {
  textSize: TextSize;
  contrast: Contrast;
  setTextSize: (v: TextSize) => void;
  setContrast: (v: Contrast) => void;
}

/**
 * Display settings (text size, high contrast), persisted separately from the
 * letter so "Delete all my data" wording can be precise about what it removes
 * (it clears both, but the letter is the part that matters).
 *
 * A tiny inline script in the root layout applies these to <html> before
 * first paint; applySettingsToDocument keeps them in sync afterwards.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      textSize: 1,
      contrast: "default",
      setTextSize: (v) => set({ textSize: v }),
      setContrast: (v) => set({ contrast: v }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);

export function applySettingsToDocument(textSize: TextSize, contrast: Contrast) {
  const d = document.documentElement;
  if (textSize > 1) d.setAttribute("data-textsize", String(textSize));
  else d.removeAttribute("data-textsize");
  if (contrast === "high") d.setAttribute("data-contrast", "high");
  else d.removeAttribute("data-contrast");
}

/** Inline <head> script: applies saved settings before first paint (no flash). */
export const SETTINGS_BOOT_SCRIPT = `try{var s=(JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_STORAGE_KEY
)})||"{}").state)||{};var d=document.documentElement;if(s.textSize>1)d.setAttribute("data-textsize",String(s.textSize));if(s.contrast==="high")d.setAttribute("data-contrast","high");}catch(e){}`;
