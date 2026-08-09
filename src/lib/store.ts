import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LetterData, LetterMeta, LetterPath, SectionKey } from "@/lib/schema";

export const LETTER_STORAGE_KEY = "twl-loi-letter-v1";

interface LetterState {
  data: LetterData;
  meta: LetterMeta;
  /** True once localStorage has been read. Forms must not mount before this. */
  hasHydrated: boolean;
  setSection: <K extends SectionKey>(key: K, values: NonNullable<LetterData[K]>) => void;
  setLastVisited: (slug: string) => void;
  /** Chosen on /letter; decides which section set the wizard and PDFs use. */
  setLetterPath: (path: LetterPath) => void;
  ackFinalWishes: () => void;
  /** Used by backup import. Replaces everything. */
  replaceAll: (data: LetterData, meta?: LetterMeta) => void;
  clearAll: () => void;
  markHydrated: () => void;
}

export const useLetterStore = create<LetterState>()(
  persist(
    (set) => ({
      data: {},
      meta: {},
      hasHydrated: false,
      setSection: (key, values) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            data: { ...s.data, [key]: values },
            meta: { ...s.meta, updatedAt: now, startedAt: s.meta.startedAt ?? now },
          };
        }),
      setLastVisited: (slug) =>
        set((s) =>
          s.meta.lastVisitedSlug === slug ? s : { meta: { ...s.meta, lastVisitedSlug: slug } }
        ),
      setLetterPath: (path) =>
        set((s) => (s.meta.letterPath === path ? s : { meta: { ...s.meta, letterPath: path } })),
      ackFinalWishes: () => set((s) => ({ meta: { ...s.meta, finalWishesAck: true } })),
      replaceAll: (data, meta) =>
        set({ data, meta: { ...(meta ?? {}), updatedAt: new Date().toISOString() } }),
      clearAll: () => set({ data: {}, meta: {} }),
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: LETTER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, meta: s.meta }),
      // Hydration is triggered manually from a client effect so the server
      // render and first client render always match (see StoreHydrator).
      skipHydration: true,
      version: 1,
    }
  )
);
