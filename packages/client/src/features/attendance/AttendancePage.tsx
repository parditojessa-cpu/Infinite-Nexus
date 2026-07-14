import { useState } from "react";
import { useAuthStore } from "../../lib/authStore";
import { useUiStore } from "../../lib/uiStore";
import { Badge } from "../../components/Badge";
import { useCourses } from "../courses/api";
import { useAttendanceReport, useCourseRoster, useMyAttendance, useSaveAttendance } from "./api";

const STATUS_META: Record<string, { label: string; color: string }> = {
  present: { label: "Present", color: "var(--color-success)" },
  late: { label: "Late", color: "var(--color-warning)" },
  absent: { label: "Absent", color: "var(--color-danger)" },
  excused: { label: "Excused", color: "var(--color-info)" },
};

function StudentAttendance() {
  const { data, isLoading } = useMyAttendance();
  if (isLoading) return <p className="text-sm text-text-secondary">Loading attendance…</p>;
  if (!data) return <p className="text-sm text-danger">Couldn't load attendance.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col items-center gap-2 py-8">
        <span className="font-heading font-bold text-4xl text-primary">{data.attendanceRate}%</span>
        <span className="text-text-secondary text-sm">Overall Attendance</span>
      </div>
      <div className="card flex flex-col gap-2">
        {data.history.map((h) => (
          <div key={h.id} className="flex justify-between items-center border-b border-border last:border-0 py-2 text-sm">
            <span>{new Date(h.date).toLocaleDateString()}</span>
            <span className="text-text-secondary">{h.subject}</span>
            <Badge label={STATUS_META[h.status]?.label ?? h.status} color={STATUS_META[h.status]?.color ?? "#888"} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeacherAttendance() {
  const { data: courses } = useCourses();
  const [courseId, setCourseId] = useState<string | undefined>();
  const activeCourseId = courseId ?? courses?.[0]?.id;
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: roster, isLoading } = useCourseRoster(activeCourseId, date);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const saveAttendance = useSaveAttendance(activeCourseId, date);
  const attendanceReport = useAttendanceReport();
  const pushToast = useUiStore((s) => s.pushToast);

  // Any student not explicitly marked defaults to Present — teachers only
  // need to flag exceptions (Late / Absent / Excused).
  const getStatus = (studentId: string, fallback: string | null) => drafts[studentId] ?? fallback ?? "present";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={activeCourseId ?? ""} onChange={(e) => setCourseId(e.target.value)} className="rounded-control border px-3 py-2 text-sm">
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-control border px-3 py-2 text-sm" />
        <button
          onClick={async () => {
            const records = (roster ?? []).map((r) => ({ studentId: r.studentId, status: getStatus(r.studentId, r.status) }));
            await saveAttendance.mutateAsync(records);
            pushToast("Attendance saved", "success");
          }}
          className="btn-primary text-sm"
        >
          Save Attendance
        </button>
        <button
          onClick={() => activeCourseId && attendanceReport.mutate(activeCourseId)}
          className="text-sm px-3 py-2 rounded-control border border-border hover:bg-bg"
        >
          Generate Attendance Report
        </button>
      </div>
      <p className="text-xs text-text-secondary -mt-2">
        Everyone defaults to <span className="text-success font-medium">Present</span> — click Late, Absent, or
        Excused only for students who aren't.
      </p>

      {attendanceReport.data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Attendance Rate</th>
                <th className="py-2">Days Recorded</th>
              </tr>
            </thead>
            <tbody>
              {attendanceReport.data.map((r) => (
                <tr key={r.studentName} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">{r.studentName}</td>
                  <td className="py-2 pr-4">{r.attendanceRate}%</td>
                  <td className="py-2">{r.totalDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading roster…</p>
      ) : (
        <div className="card flex flex-col gap-2">
          {(roster ?? []).map((r) => (
            <div key={r.studentId} className="flex items-center justify-between border-b border-border last:border-0 py-2">
              <span className="text-sm font-medium">{r.studentName}</span>
              <div className="flex gap-1">
                {(["present", "late", "absent", "excused"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setDrafts((d) => ({ ...d, [r.studentId]: s }))}
                    className="text-xs px-2.5 py-1 rounded-pill border"
                    style={{
                      borderColor: STATUS_META[s].color,
                      background: getStatus(r.studentId, r.status) === s ? STATUS_META[s].color : "transparent",
                      color: getStatus(r.studentId, r.status) === s ? "white" : STATUS_META[s].color,
                    }}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {(roster ?? []).length === 0 && <p className="text-sm text-text-secondary">No students enrolled.</p>}
        </div>
      )}
    </div>
  );
}

export function AttendancePage() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "teacher" ? <TeacherAttendance /> : <StudentAttendance />;
}
