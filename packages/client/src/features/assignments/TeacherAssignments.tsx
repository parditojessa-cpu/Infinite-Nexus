import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useUiStore } from "../../lib/uiStore";
import { useAssignments, useAssignmentSubmissions, useGradeSubmission } from "./api";
import { useCourses } from "../courses/api";

function CreateAssignmentForm() {
  const { data: courses } = useCourses();
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [points, setPoints] = useState(100);
  const [courseId, setCourseId] = useState("");

  const create = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("courseId", courseId || courses?.[0]?.id || "");
      form.append("title", title);
      form.append("instructions", instructions);
      if (dueDate) form.append("dueDate", dueDate);
      form.append("pointsPossible", String(points));
      return apiFetch("/assignments", { method: "POST", body: form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      pushToast("Assignment created", "success");
      setOpen(false);
      setTitle("");
      setInstructions("");
    },
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm self-start">
        + Create Assignment
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-2">
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="rounded-control border px-3 py-2 text-sm">
        <option value="">Select course…</option>
        {courses?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-control border px-3 py-2 text-sm" />
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Instructions"
        rows={3}
        className="rounded-control border px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-control border px-3 py-2 text-sm flex-1" />
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="rounded-control border px-3 py-2 text-sm w-28"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={() => create.mutate()} disabled={!title || create.isPending} className="btn-primary text-sm">
          Save
        </button>
        <button onClick={() => setOpen(false)} className="text-sm px-3 py-2 rounded-control border border-border">
          Cancel
        </button>
      </div>
    </div>
  );
}

function GradingPanel({ assignmentId }: { assignmentId: string }) {
  const { data: submissions } = useAssignmentSubmissions(assignmentId);
  const grade = useGradeSubmission();
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  return (
    <div className="flex flex-col gap-2 mt-3">
      {(submissions ?? []).map((s) => (
        <div key={s.id} className="border-t border-border pt-2 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{s.studentName}</span>
            <span className="text-text-secondary capitalize">{s.status.replace("_", " ")}</span>
          </div>
          {s.note && <p className="text-text-secondary">{s.note}</p>}
          {s.status !== "graded" ? (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Score"
                value={drafts[s.id]?.score ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: { ...d[s.id], score: e.target.value, feedback: d[s.id]?.feedback ?? "" } }))}
                className="w-20 rounded-control border px-2 py-1 text-sm"
              />
              <input
                placeholder="Feedback"
                value={drafts[s.id]?.feedback ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: { ...d[s.id], feedback: e.target.value, score: d[s.id]?.score ?? "" } }))}
                className="flex-1 rounded-control border px-2 py-1 text-sm"
              />
              <button
                onClick={() =>
                  grade.mutate({ submissionId: s.id, score: Number(drafts[s.id]?.score ?? 0), feedback: drafts[s.id]?.feedback ?? "" })
                }
                className="text-xs px-3 py-1.5 rounded-control border border-border hover:bg-bg"
              >
                Grade
              </button>
            </div>
          ) : (
            <p className="text-text-secondary">
              Graded: {s.score} — {s.feedback}
            </p>
          )}
        </div>
      ))}
      {(submissions ?? []).length === 0 && <p className="text-text-secondary text-sm">No submissions yet.</p>}
    </div>
  );
}

export function TeacherAssignments() {
  const { data, isLoading } = useAssignments();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading assignments…</p>;

  return (
    <div className="flex flex-col gap-4">
      <CreateAssignmentForm />
      {(data ?? []).map((a) => (
        <div key={a.id} className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-sm">{a.title}</h3>
              <p className="text-xs text-text-secondary">{a.courseName}</p>
            </div>
            <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="text-sm text-primary">
              {a.gradedCount}/{a.submissionCount} graded
            </button>
          </div>
          {expanded === a.id && <GradingPanel assignmentId={a.id} />}
        </div>
      ))}
      {(data ?? []).length === 0 && <p className="text-sm text-text-secondary">No assignments yet.</p>}
    </div>
  );
}
