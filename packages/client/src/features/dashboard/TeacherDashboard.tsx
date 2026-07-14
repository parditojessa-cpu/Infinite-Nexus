import { StatCard } from "../../components/StatCard";
import type { TeacherDashboardData } from "./api";

export function TeacherDashboard({ data }: { data: TeacherDashboardData }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value={data.stats.students} />
        <StatCard label="Classes Today" value={data.stats.classesToday} />
        <StatCard label="Avg. Class Grade" value={data.stats.avgClassGrade ?? "—"} />
        <StatCard label="Pending to Grade" value={data.stats.pendingToGrade} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Today's Classes</h3>
          <div className="flex flex-col gap-2">
            {data.classes.length === 0 && <p className="text-sm text-text-secondary">No classes yet.</p>}
            {data.classes.map((c) => (
              <div key={c.id} className="flex justify-between text-sm border-b border-border last:border-0 py-2">
                <span className="font-medium">{c.title}</span>
                <span className="text-text-secondary">{c.subject}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Assignments to Check</h3>
          <p className="text-sm text-text-secondary">
            {data.stats.pendingToGrade} submission{data.stats.pendingToGrade === 1 ? "" : "s"} awaiting grading.
          </p>
        </div>
      </div>
    </div>
  );
}
