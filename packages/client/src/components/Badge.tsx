export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold text-white"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}
