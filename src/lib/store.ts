import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LetterData, LetterMeta, MarkValue, SectionKey } from "@/lib/schema";
import { migrateV1 } from "@/lib/migrate";

export const LETTER_STORAGE_KEY = "twl-loi-letter-v1";

interface LetterState {
  data: LetterData;
  meta: LetterMeta;
  /** True once localStorage has been read. Forms must not mount before this. */
  hasHydrated: boolean;
  setSection: <K extends SectionKey>(key: K, values: NonNullable<LetterData[K]>) => void;
  setLastVisited: (slug: string) => void;
  /** Patch onboarding/routing answers. Never touches `data` — changing an
   *  answer re-gates the form and loses nothing. */
  setMetaAnswers: (patch: Partial<LetterMeta>) => void;
  /** Set or clear a not-applicable / come-back marker ("section" or "section.field"). */
  setMark: (key: string, value: MarkValue | null) => void;
  /** Acknowledge the gentle interstitial before an emotional section. */
  ackEmotional: (slug: string) => void;
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
      setMetaAnswers: (patch) =>
        set((s) => ({ meta: { ...s.meta, ...patch } })),
      setMark: (key, value) =>
        set((s) => {
          const marks = { ...(s.data.marks ?? {}) };
          if (value === null) delete marks[key];
          else marks[key] = value;
          return { data: { ...s.data, marks } };
        }),
      ackEmotional: (slug) =>
        set((s) => {
          const acks = s.meta.emotionalAcks ?? [];
          if (acks.includes(slug)) return s;
          return { meta: { ...s.meta, emotionalAcks: [...acks, slug] } };
        }),
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
      version: 2,
      /**
       * v1 → v2: both old path shapes onto the canonical schema, no words
       * lost, routing answers inferred as PRE-FILLS for a one-time
       * onboarding pass (lib/migrate.ts). Runs once, on first load after
       * the update.
       */
      migrate: (persisted, version) => {
        if (version >= 2) return persisted as { data: LetterData; meta: LetterMeta };
        const state = (persisted ?? {}) as { data?: unknown; meta?: unknown };
        return migrateV1(state);
      },
    }
  )
);
