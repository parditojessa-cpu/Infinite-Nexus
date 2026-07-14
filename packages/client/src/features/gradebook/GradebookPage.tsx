import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { useAuthStore } from "../../lib/authStore";
import { useUiStore } from "../../lib/uiStore";
import { downloadAuthedFile } from "../../lib/download";
import { StatCard } from "../../components/StatCard";
import { Badge } from "../../components/Badge";
import { useCourses } from "../courses/api";
import { useCourseGradebook, useMyGradebook } from "./api";

function StudentGradebookView() {
  const { data, isLoading, isError } = useMyGradebook();
  if (isLoading) return <p className="text-sm text-text-secondary">Loading gradebook…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load your gradebook.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Average" value={data.summary.average} />
        <StatCard label="Highest Score" value={data.summary.highest} />
        <StatCard label="Lowest Score" value={data.summary.lowest} />
        <StatCard label="Completion Rate" value={`${data.summary.completionRate}%`} />
      </div>

      <div className="card">
        <h3 className="font-heading font-semibold mb-3">Average per Subject</h3>
        <Bar
          data={{
            labels: data.chartBySubject.map((c) => c.subject),
            datasets: [{ label: "Average %", data: data.chartBySubject.map((c) => c.average), backgroundColor: "#0f4c81" }],
          }}
          options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">%</th>
              <th className="py-2 pr-4">Quarter</th>
              <th className="py-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 capitalize">{r.category}</td>
                <td className="py-2 pr-4">
                  {r.score}/{r.maxScore}
                </td>
                <td className="py-2 pr-4">{r.percent}%</td>
                <td className="py-2 pr-4">{r.quarter}</td>
                <td className="py-2">
                  <Badge label={r.remarks} color={r.remarks === "Passed" ? "var(--color-success)" : "var(--color-danger)"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeacherGradebookView() {
  const { data: courses } = useCourses();
  const [courseId, setCourseId] = useState<string | undefined>();
  const activeCourseId = courseId ?? courses?.[0]?.id;
  const { data, isLoading } = useCourseGradebook(activeCourseId);
  const [search, setSearch] = useState("");
  const pushToast = useUiStore((s) => s.pushToast);

  const filtered = (data ?? []).filter((r) => r.studentName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <select
          value={activeCourseId ?? ""}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded-control border px-3 py-2 text-sm"
        >
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students…"
          className="rounded-control border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await downloadAuthedFile(`/api/gradebook/export/pdf?courseId=${activeCourseId}`, `gradebook-${activeCourseId}.pdf`);
              } catch {
                pushToast("Export failed", "danger");
              }
            }}
            className="text-sm px-3 py-2 rounded-control border border-border hover:bg-bg"
          >
            Export PDF
          </button>
          <button
            onClick={async () => {
              try {
                await downloadAuthedFile(`/api/gradebook/export/excel?courseId=${activeCourseId}`, `gradebook-${activeCourseId}.xlsx`);
              } catch {
                pushToast("Export failed", "danger");
              }
            }}
            className="text-sm px-3 py-2 rounded-control border border-border hover:bg-bg"
          >
            Export Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Final Grade</th>
                <th className="py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.studentId} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">{r.studentName}</td>
                  <td className="py-2 pr-4">{r.finalGrade}%</td>
                  <td className="py-2">
                    <Badge label={r.remarks} color={r.remarks === "Passed" ? "var(--color-success)" : "var(--color-danger)"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-sm text-text-secondary p-3">No students found.</p>}
        </div>
      )}
    </div>
  );
}

export function GradebookPage() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "teacher" ? <TeacherGradebookView /> : <StudentGradebookView />;
}
