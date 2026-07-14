import { Bar, Line, Radar } from "react-chartjs-2";
import { StatCard } from "../../components/StatCard";
import { ProgressBar } from "../../components/ProgressBar";
import { InterventionStatusCard } from "../dashboard/InterventionStatusCard";
import { useProgress } from "./api";

function sign(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function AnalyticsPage() {
  const { data, isLoading } = useProgress();
  if (isLoading) return <p className="text-sm text-text-secondary">Loading analytics…</p>;
  if (!data) return <p className="text-sm text-danger">Couldn't load your analytics.</p>;

  const { charts } = data;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Weekly Improvement" value={`${sign(data.improvement.weekly)}%`} />
        <StatCard label="Monthly Improvement" value={`${sign(data.improvement.monthly)}%`} />
        <StatCard label="Yearly Improvement" value={`${sign(data.improvement.yearly)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Average Grades</h3>
          <Line
            data={{
              labels: charts.gradesTrend.map((g) => g.label),
              datasets: [{ label: "Grade %", data: charts.gradesTrend.map((g) => g.value), borderColor: "#0f4c81", tension: 0.3 }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Attendance Trend</h3>
          <Line
            data={{
              labels: charts.attendanceTrend.map((a) => a.label),
              datasets: [{ label: "Attendance %", data: charts.attendanceTrend.map((a) => a.value), borderColor: "#2ba39c", tension: 0.3 }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Quiz Performance</h3>
          <Bar
            data={{
              labels: charts.quizPerformance.map((q) => q.label),
              datasets: [{ label: "Score %", data: charts.quizPerformance.map((q) => q.value), backgroundColor: "#8b5cf6" }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Assignment Completion</h3>
          <Bar
            data={{
              labels: charts.assignmentCompletion.map((a) => a.label),
              datasets: [{ label: "Count", data: charts.assignmentCompletion.map((a) => a.value), backgroundColor: "#c98a1e" }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Competency Mastery</h3>
          <Radar
            data={{
              labels: Object.keys(data.competencyMastery),
              datasets: [
                {
                  label: "Mastery %",
                  data: Object.values(data.competencyMastery),
                  backgroundColor: "rgba(15,76,129,0.2)",
                  borderColor: "#0f4c81",
                },
              ],
            }}
            options={{ responsive: true, scales: { r: { min: 0, max: 100 } } }}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 className="font-heading font-semibold mb-2">Learning Progress</h3>
            <ProgressBar value={data.learningProgress} />
            <span className="text-xs text-text-secondary">{data.learningProgress}% average completion across courses</span>
          </div>
          <InterventionStatusCard status={data.interventionStatus} progressPercent={35} />
        </div>
      </div>
    </div>
  );
}
