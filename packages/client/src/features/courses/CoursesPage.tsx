import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../lib/authStore";
import { ProgressBar } from "../../components/ProgressBar";
import { useCourses } from "./api";

export function CoursesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useCourses();

  if (isLoading) return <p className="text-sm text-text-secondary">Loading courses…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load courses.</p>;

  const filtered = data.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search courses…"
        className="rounded-control border px-3 py-2.5 text-sm max-w-sm"
        style={{ borderColor: "var(--color-border-strong)" }}
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
        {filtered.map((c) => (
          <div key={c.id} className="card flex flex-col gap-3">
            <div className="h-[100px] rounded-control bg-bg flex items-center justify-center text-2xl relative">
              📘
              <span className="absolute top-2 right-2 rounded-pill bg-primary text-white text-[10px] px-2 py-0.5">
                {c.subject}
              </span>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-[15px] truncate">{c.title}</h3>
              {c.teacherName && <p className="text-xs text-text-secondary truncate">{c.teacherName}</p>}
              {c.studentCount !== undefined && (
                <p className="text-xs text-text-secondary">{c.studentCount} students</p>
              )}
            </div>
            {c.progressPercent !== undefined && (
              <div>
                <ProgressBar value={c.progressPercent} />
                <span className="text-xs text-text-secondary">{Math.round(c.progressPercent)}%</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{c.moduleCount} modules</span>
              <span>{c.lessonCount} lessons</span>
            </div>
            <button
              onClick={() =>
                role === "teacher"
                  ? navigate(`/teacher/classes/${c.id}/manage`)
                  : navigate(`/student/courses/${c.id}`)
              }
              className="btn-primary w-full text-sm"
            >
              {role === "teacher" ? "Manage Content" : "Continue Learning"}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-text-secondary">No courses found.</p>}
      </div>
    </div>
  );
}
