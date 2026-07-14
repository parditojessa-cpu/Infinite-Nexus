import { create } from "zustand";
import { DEFAULT_PALETTE_ID } from "@finite-nexus/shared";

export interface Toast {
  id: string;
  message: string;
  tone?: "default" | "success" | "danger";
}

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  paletteId: string;
  setPalette: (id: string) => void;
  toasts: Toast[];
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  paletteId: DEFAULT_PALETTE_ID,
  setPalette: (id) => set({ paletteId: id }),
  toasts: [],
  pushToast: (message, tone = "default") => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => get().dismissToast(id), 3000);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
