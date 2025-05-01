import { create } from "zustand";
import { SnapTarget } from "@src/types/page";

export interface SnapTargetInfo {
  target: SnapTarget;
  style: React.CSSProperties;
}

interface SnapTargetState {
  current: SnapTargetInfo | null;
  setTarget: (info: SnapTargetInfo) => void;
  reset: () => void;
}

export const useSnapTargetStore = create<SnapTargetState>((set) => ({
  current: null,
  setTarget: (info) => set({ current: info }),
  reset: () => set({ current: null }),
}));
