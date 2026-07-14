import { useState } from "react";
import { useAuthStore } from "../../lib/authStore";
import { useUiStore } from "../../lib/uiStore";
import { Badge } from "../../components/Badge";
import { useAssignments, useSubmitAssignment, type AssignmentSummary } from "./api";
import { TeacherAssignments } from "./TeacherAssignments";

const STATUS_COLOR: Record<string, string> = {
  not_submitted: "var(--color-text-secondary)",
  submitted: "var(--color-warning)",
  graded: "var(--color-success)",
};

function StudentAssignmentCard({ assignment }: { assignment: AssignmentSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState("");
  const pushToast = useUiStore((s) => s.pushToast);
  const submit = useSubmitAssignment(assignment.id);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-heading font-semibold text-sm">{assignment.title}</h3>
          <p className="text-xs text-text-secondary">{assignment.courseName}</p>
          {assignment.dueDate && (
            <p className="text-xs text-text-secondary">Due {new Date(assignment.dueDate).toLocaleDateString()}</p>
          )}
        </div>
        <Badge label={(assignment.status ?? "not_submitted").replace("_", " ")} color={STATUS_COLOR[assignment.status ?? "not_submitted"]} />
      </div>

      {assignment.status === "graded" && (
        <div className="mt-3 bg-bg rounded-control p-3 text-sm">
          <p className="font-medium">
            Score: {assignment.score}/{assignment.pointsPossible}
          </p>
          {assignment.feedback && <p className="text-text-secondary mt-1">{assignment.feedback}</p>}
        </div>
      )}

      {assignment.status !== "graded" && (
        <div className="mt-3">
          <button onClick={() => setExpanded((e) => !e)} className="text-sm text-primary">
            {expanded ? "Cancel" : assignment.status === "submitted" ? "View submission" : "Submit assignment"}
          </button>
          {expanded && assignment.status !== "submitted" && (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Notes for your teacher (file upload optional in this build)…"
                className="w-full rounded-control border p-2 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
              />
              <button
                onClick={async () => {
                  await submit.mutateAsync(note);
                  pushToast("Assignment submitted", "success");
                  setExpanded(false);
                }}
                className="btn-primary text-sm self-start"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentAssignments() {
  const { data, isLoading, isError } = useAssignments();
  if (isLoading) return <p className="text-sm text-text-secondary">Loading assignments…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load assignments.</p>;
  return (
    <div className="flex flex-col gap-3">
      {data.map((a) => (
        <StudentAssignmentCard key={a.id} assignment={a} />
      ))}
      {data.length === 0 && <p className="text-sm text-text-secondary">No assignments yet.</p>}
    </div>
  );
}

export function AssignmentsPage() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "teacher" ? <TeacherAssignments /> : <StudentAssignments />;
}
