import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { PALETTES } from "@finite-nexus/shared";
import { router } from "./router";
import { useUiStore } from "../lib/uiStore";
import { ToastHost } from "../layout/ToastHost";
import { queryClient } from "../lib/queryClient";

function usePaletteEffect() {
  const paletteId = useUiStore((s) => s.paletteId);
  useEffect(() => {
    const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
    document.documentElement.style.setProperty("--color-primary", palette.primary);
    document.documentElement.style.setProperty("--color-accent", palette.accent);
  }, [paletteId]);
}

export function App() {
  usePaletteEffect();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastHost />
    </QueryClientProvider>
  );
}
