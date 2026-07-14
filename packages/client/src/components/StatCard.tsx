export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-text-secondary text-xs uppercase tracking-wide">{label}</span>
      <span className="font-heading font-bold text-[22px] leading-tight">{value}</span>
      {hint && <span className="text-text-secondary text-xs">{hint}</span>}
    </div>
  );
}
