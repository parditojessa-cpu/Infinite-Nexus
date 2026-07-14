import { useUiStore } from "../lib/uiStore";

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="rounded-pill px-4 py-2 text-sm text-white shadow-lg text-left"
          style={{
            background:
              t.tone === "success" ? "var(--color-success)" : t.tone === "danger" ? "var(--color-danger)" : "#1a2430",
          }}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
