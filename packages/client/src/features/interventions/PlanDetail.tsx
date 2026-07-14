import { useState } from "react";
import { Line, Radar } from "react-chartjs-2";
import { downloadAuthedFile } from "../../lib/download";
import { useUiStore } from "../../lib/uiStore";
import { useActivities, useCreateActivity, usePlanProgress, useTimeline, useUpdateActivity, type InterventionPlan } from "./api";

const TIMELINE_COLORS: Record<string, string> = {
  started: "#0f4c81",
  activity_completed: "#2f6f4f",
  teacher_feedback: "#c98a1e",
  student_reflection: "#8b5cf6",
  weekly_progress: "#2ba39c",
  monthly_evaluation: "#c1443b",
};

export function PlanDetail({ plan }: { plan: InterventionPlan }) {
  const { data: activities } = useActivities(plan.id);
  const createActivity = useCreateActivity(plan.id);
  const updateActivity = useUpdateActivity(plan.id);
  const { data: progress } = usePlanProgress(plan.id);
  const { data: timeline } = useTimeline(plan.id);
  const [newActivity, setNewActivity] = useState("");
  const pushToast = useUiStore((s) => s.pushToast);

  const seriesEntries = Object.entries(progress?.series ?? {});
  const firstSeries = seriesEntries[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold">{plan.subject} — IIP</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary capitalize">{plan.status}</span>
            <button
              onClick={async () => {
                try {
                  await downloadAuthedFile(`/api/interventions/plans/${plan.id}/report`, `intervention-report-${plan.id}.pdf`);
                } catch {
                  pushToast("Report generation failed", "danger");
                }
              }}
              className="text-xs px-3 py-1.5 rounded-control border border-border hover:bg-bg"
            >
              📄 Download Report
            </button>
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-2">{plan.competency}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {plan.rootCauses.map((rc) => (
            <span key={rc} className="text-[10px] bg-bg px-2 py-0.5 rounded-pill">
              {rc.replace(/_/g, " ")}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {plan.strategies.map((s) => (
            <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-pill">
              {s.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold mb-2">Intervention Activities</h3>
        <div className="flex gap-2 mb-3">
          <input
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="New activity title"
            className="flex-1 rounded-control border px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              if (!newActivity.trim()) return;
              createActivity.mutate({ title: newActivity, instructions: "" });
              setNewActivity("");
            }}
            className="text-sm px-3 py-2 rounded-control border border-border hover:bg-bg"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {(activities ?? []).map((a) => (
            <div key={a.id} className="border-t border-border pt-2 text-sm flex items-center justify-between">
              <span>{a.title}</span>
              <button
                onClick={() => updateActivity.mutate({ id: a.id, status: a.status === "completed" ? "assigned" : "completed" })}
                className={`text-xs px-2 py-1 rounded-pill ${a.status === "completed" ? "bg-success text-white" : "bg-bg"}`}
              >
                {a.status === "completed" ? "Completed" : "Mark done"}
              </button>
            </div>
          ))}
          {(activities ?? []).length === 0 && <p className="text-sm text-text-secondary">No activities yet.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-heading font-semibold mb-2">Progress Monitoring</h3>
          {firstSeries ? (
            <Line
              data={{
                labels: firstSeries[1].map((p) => new Date(p.date).toLocaleDateString()),
                datasets: seriesEntries.map(([type, points], i) => ({
                  label: type,
                  data: points.map((p) => p.value),
                  borderColor: ["#0f4c81", "#2ba39c", "#c98a1e"][i % 3],
                })),
              }}
              options={{ responsive: true }}
            />
          ) : (
            <p className="text-sm text-text-secondary">No progress metrics recorded yet.</p>
          )}
        </div>
        <div className="card">
          <h3 className="font-heading font-semibold mb-2">Competency Dimensions</h3>
          {progress && Object.keys(progress.radar).length > 0 ? (
            <Radar
              data={{
                labels: Object.keys(progress.radar),
                datasets: [{ label: "Score", data: Object.values(progress.radar), borderColor: "#0f4c81", backgroundColor: "rgba(15,76,129,0.2)" }],
              }}
              options={{ responsive: true, scales: { r: { min: 0, max: 100 } } }}
            />
          ) : (
            <p className="text-sm text-text-secondary">No dimension data yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold mb-2">Intervention Timeline</h3>
        <div className="flex flex-col gap-2">
          {(timeline ?? []).map((e) => (
            <div key={e.id} className="flex items-start gap-2 text-sm">
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: TIMELINE_COLORS[e.eventType] ?? "#888" }} />
              <div>
                <p>{e.description}</p>
                <p className="text-xs text-text-secondary">{new Date(e.eventDate).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {(timeline ?? []).length === 0 && <p className="text-sm text-text-secondary">No timeline events yet.</p>}
        </div>
      </div>
    </div>
  );
}
