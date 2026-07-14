import { useState } from "react";
import { RISK_TIER_COLORS, RISK_TIERS, INTERVENTION_STATUSES, INTERVENTION_STATUS_META } from "@finite-nexus/shared";
import { Badge } from "../../components/Badge";
import { StatCard } from "../../components/StatCard";
import { useRoster, useStudentProfile, useUpdateStudentStatus, usePlans } from "./api";
import { IIPForm } from "./IIPForm";
import { PlanDetail } from "./PlanDetail";
import { FrameworkReference } from "./FrameworkReference";
import { ProgramsPanel } from "./ProgramsPanel";

const TABS = ["Roster", "Framework", "Programs"] as const;

export function InterventionsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Roster");
  const { data: roster } = useRoster();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const { data: profile } = useStudentProfile(selectedStudentId);
  const updateStatus = useUpdateStudentStatus(selectedStudentId);
  const { data: plans } = usePlans(selectedStudentId ?? undefined);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId) ?? plans?.[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex rounded-pill bg-bg p-1 w-fit text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-pill ${tab === t ? "bg-primary text-white" : "text-text-secondary"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Framework" && <FrameworkReference />}
      {tab === "Programs" && <ProgramsPanel />}

      {tab === "Roster" && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <div className="card h-fit">
            <h3 className="font-heading font-semibold mb-3">Student Roster</h3>
            <div className="flex flex-col gap-1">
              {(roster ?? []).map((s) => (
                <button
                  key={s.studentId}
                  onClick={() => {
                    setSelectedStudentId(s.studentId);
                    setSelectedPlanId(null);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-control text-left text-sm ${
                    selectedStudentId === s.studentId ? "bg-primary/10" : "hover:bg-bg"
                  }`}
                >
                  <span>{s.name}</span>
                  <Badge label={s.riskTier.replace(/_/g, " ")} color={RISK_TIER_COLORS[s.riskTier] ?? "#888"} />
                </button>
              ))}
              {(roster ?? []).length === 0 && <p className="text-sm text-text-secondary">No students yet.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {!selectedStudentId ? (
              <p className="text-sm text-text-secondary">Select a student to view their intervention profile.</p>
            ) : !profile ? (
              <p className="text-sm text-text-secondary">Loading…</p>
            ) : (
              <>
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-semibold">{profile.name}</h3>
                    <Badge label={profile.riskTier.replace(/_/g, " ")} color={RISK_TIER_COLORS[profile.riskTier] ?? "#888"} />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <StatCard label="Average" value={profile.stats.average ?? "—"} />
                    <StatCard label="Attendance" value={`${profile.stats.attendanceRate}%`} />
                    <StatCard label="Missing Activities" value={profile.stats.missingActivities} />
                    <StatCard label="Failed Competencies" value={profile.stats.failedCompetencies} />
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <label className="text-xs text-text-secondary">Risk tier:</label>
                    <select
                      value={profile.riskTier}
                      onChange={(e) => updateStatus.mutate({ riskTier: e.target.value, interventionStatus: profile.interventionStatus })}
                      className="text-xs rounded-control border px-2 py-1"
                    >
                      {RISK_TIERS.map((r) => (
                        <option key={r} value={r}>
                          {r.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <label className="text-xs text-text-secondary">Status:</label>
                    <select
                      value={profile.interventionStatus}
                      onChange={(e) => updateStatus.mutate({ riskTier: profile.riskTier, interventionStatus: e.target.value })}
                      className="text-xs rounded-control border px-2 py-1"
                    >
                      {INTERVENTION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {INTERVENTION_STATUS_META[s]?.label ?? s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-heading font-semibold mb-3">Individual Intervention Plans</h3>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {(plans ?? []).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`text-xs px-3 py-1.5 rounded-pill border ${
                          selectedPlan?.id === p.id ? "bg-primary text-white border-primary" : "border-border"
                        }`}
                      >
                        {p.subject}
                      </button>
                    ))}
                  </div>
                  <details>
                    <summary className="text-sm text-primary cursor-pointer">+ New Intervention Plan</summary>
                    <div className="mt-3">
                      <IIPForm studentId={profile.studentId} />
                    </div>
                  </details>
                </div>

                {selectedPlan && <PlanDetail plan={selectedPlan} />}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
