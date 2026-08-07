import { create } from "zustand";

export type SaveStatus = "idle" | "pending" | "saved";

interface SaveStatusState {
  status: SaveStatus;
  setStatus: (s: SaveStatus) => void;
}

/**
 * Not persisted — drives the "Saved" indicator in the wizard header.
 * The section form sets "pending" on change and "saved" after the debounced
 * write to the letter store lands.
 */
export const useSaveStatusStore = create<SaveStatusState>()((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
