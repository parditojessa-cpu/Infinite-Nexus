import { INTERVENTION_STATUS_META } from "@finite-nexus/shared";
import { ProgressBar } from "../../components/ProgressBar";

export function InterventionStatusCard({ status, progressPercent = 0 }: { status: string; progressPercent?: number }) {
  const meta = INTERVENTION_STATUS_META[status] ?? INTERVENTION_STATUS_META.no_intervention_required;
  return (
    <div className="card flex flex-col gap-2">
      <span className="text-text-secondary text-xs uppercase tracking-wide">Intervention Status</span>
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">{meta.emoji}</span>
        <span className="font-heading font-semibold text-sm" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      {status !== "no_intervention_required" && (
        <>
          <ProgressBar value={progressPercent} color={meta.color} />
          <span className="text-xs text-text-secondary">{progressPercent}% through current plan</span>
        </>
      )}
    </div>
  );
}
