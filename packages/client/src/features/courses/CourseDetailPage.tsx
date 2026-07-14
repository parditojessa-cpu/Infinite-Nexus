import { useParams, useNavigate } from "react-router-dom";
import { useCourseDetail } from "./api";

const STATUS_DOT: Record<string, string> = {
  done: "bg-success",
  active: "bg-primary",
  locked: "bg-black/20",
};

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseDetail(courseId);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading course…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load this course.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading font-bold text-lg">{data.title}</h2>
        <p className="text-sm text-text-secondary">{data.subject}</p>
      </div>

      {data.modules.map((m) => (
        <div key={m.id} className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">{m.title}</h3>
            <span className="text-xs text-text-secondary capitalize">{m.status}</span>
          </div>
          <div className="flex flex-col gap-1">
            {m.lessons.length === 0 && <p className="text-sm text-text-secondary">No lessons yet.</p>}
            {m.lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/student/courses/${courseId}/lessons/${l.id}`)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-control hover:bg-bg text-left text-sm"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[l.progressStatus] ?? "bg-black/20"}`} />
                <span className="flex-1 truncate">{l.title}</span>
                <span className="text-xs text-text-secondary capitalize">{l.progressStatus}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
