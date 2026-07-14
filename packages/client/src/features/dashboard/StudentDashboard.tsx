import { useState } from "react";
import type { DashboardVariant } from "@finite-nexus/shared";
import { StatCard } from "../../components/StatCard";
import { ProgressBar } from "../../components/ProgressBar";
import { InterventionStatusCard } from "./InterventionStatusCard";
import type { StudentDashboardData } from "./api";

const VARIANTS: DashboardVariant[] = ["gamified", "cards", "agenda"];

export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const [variant, setVariant] = useState<DashboardVariant>("gamified");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <div className="flex rounded-pill bg-bg p-1 text-xs">
          {VARIANTS.map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`px-3 py-1.5 rounded-pill capitalize ${
                variant === v ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {variant === "gamified" && (
        <div
          className="rounded-card p-6 text-white flex flex-col gap-4"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wide text-white/80">
                Level {data.gamification.level}
              </span>
              <h2 className="font-heading font-bold text-xl">{data.gamification.levelName}</h2>
            </div>
            <div className="flex gap-2">
              {["🥇", "🎯", "🔥"].map((b) => (
                <span key={b} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1 text-white/90">
              <span>{data.gamification.xp} XP</span>
              <span>{data.gamification.xpToNext} XP to next level</span>
            </div>
            <ProgressBar
              value={
                data.gamification.xpToNext > 0
                  ? (100 * data.gamification.xp) / (data.gamification.xp + data.gamification.xpToNext)
                  : 100
              }
              color="white"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Profile Completion" value={`${data.stats.profileCompletion}%`} />
        <StatCard label="Attendance" value={`${data.stats.attendanceRate}%`} />
        <StatCard label="Current Average" value={data.stats.currentAverage ?? "—"} />
        <StatCard label="Active Courses" value={data.stats.activeCourses} />
      </div>

      {variant === "agenda" && (
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Today's Schedule</h3>
          <p className="text-sm text-text-secondary">
            No scheduled events yet — this timeline populates once class schedules are wired up.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h3 className="font-heading font-semibold mb-3">Continue Learning</h3>
          <div className="flex flex-col gap-3">
            {data.courses.length === 0 && (
              <p className="text-sm text-text-secondary">You're not enrolled in any courses yet.</p>
            )}
            {data.courses.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.title}</p>
                  <ProgressBar value={c.progressPercent} />
                </div>
                <span className="text-xs text-text-secondary w-10 text-right">{Math.round(c.progressPercent)}%</span>
              </div>
            ))}
          </div>
        </div>

        <InterventionStatusCard status={data.interventionStatus} progressPercent={35} />
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold mb-3">Announcements</h3>
        <div className="flex flex-col gap-3">
          {data.announcements.length === 0 && (
            <p className="text-sm text-text-secondary">No announcements yet.</p>
          )}
          {data.announcements.map((a) => (
            <div key={a.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <p className="font-medium text-sm">{a.title}</p>
              <p className="text-xs text-text-secondary">{a.author}</p>
              <p className="text-sm mt-1">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
