export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded-pill bg-black/5 overflow-hidden">
      <div
        className="h-full rounded-pill transition-all"
        style={{ width: `${clamped}%`, background: color ?? "var(--color-primary)" }}
      />
    </div>
  );
}
