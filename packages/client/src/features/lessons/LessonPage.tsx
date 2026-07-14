import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUiStore } from "../../lib/uiStore";
import { downloadAuthedFile } from "../../lib/download";
import { DiscussionThreadList } from "../discussions/DiscussionThreadList";
import { useQuizzesForLesson } from "../quizzes/api";
import { useLesson, useSaveNotes, useToggleBookmark, useUpdateLessonProgress } from "./api";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-heading font-semibold text-sm mb-1">{title}</h3>
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

export function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);
  const { data, isLoading, isError } = useLesson(lessonId);
  const { data: quizzes } = useQuizzesForLesson(lessonId);
  const updateProgress = useUpdateLessonProgress(lessonId);
  const toggleBookmark = useToggleBookmark(lessonId);
  const saveNotes = useSaveNotes(lessonId);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (data) setNotes(data.progress.studentNotes ?? "");
  }, [data]);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading lesson…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load this lesson.</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      <aside className="card lg:sticky lg:top-20 h-fit">
        <h3 className="font-heading font-semibold text-sm mb-3">{data.moduleTitle}</h3>
        <div className="flex flex-col gap-1">
          {data.siblingLessons.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate(`/student/courses/${courseId}/lessons/${l.id}`)}
              className={`text-left text-sm px-3 py-2 rounded-control ${
                l.id === data.id ? "bg-primary text-white" : "hover:bg-bg"
              }`}
            >
              {l.title}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-col gap-5">
        <div className="card">
          <span className="text-xs text-primary font-semibold uppercase">{data.learningCompetency}</span>
          <h2 className="font-heading font-bold text-lg mt-1">{data.title}</h2>
        </div>

        {data.objectives.length > 0 && (
          <div className="card">
            <Section title="Objectives">
              <ul className="list-disc pl-5">
                {data.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        <div className="card aspect-video bg-[#1a2430] flex items-center justify-center text-white text-3xl">▶</div>

        {data.examples.length > 0 && (
          <div className="card">
            <Section title="Examples">
              <ul className="list-disc pl-5">
                {data.examples.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {data.lessonNotes && (
          <div className="card">
            <Section title="Lesson Notes">{data.lessonNotes}</Section>
          </div>
        )}
        {data.assessment && (
          <div className="card">
            <Section title="Assessment">{data.assessment}</Section>
          </div>
        )}
        {data.reflectionPrompt && (
          <div className="card">
            <Section title="Reflection">{data.reflectionPrompt}</Section>
          </div>
        )}
        {data.references.length > 0 && (
          <div className="card">
            <Section title="References">
              <ul className="list-disc pl-5">
                {data.references.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {data.resources.length > 0 && (
          <div className="card">
            <h3 className="font-heading font-semibold text-sm mb-2">Resources</h3>
            <div className="flex flex-col gap-1">
              {data.resources.map((r) => (
                <button
                  key={r.id}
                  onClick={() => r.fileId && downloadAuthedFile(`/api/files/${r.fileId}`, r.fileName)}
                  className="text-sm text-primary hover:underline text-left"
                >
                  📄 {r.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card flex flex-wrap gap-2">
          <button
            onClick={() =>
              quizzes?.[0]
                ? navigate(`/student/quizzes/${quizzes[0].id}`)
                : pushToast("No quiz has been assigned for this lesson yet.")
            }
            className="btn-primary text-sm"
          >
            Take Quiz
          </button>
          <button
            onClick={() => {
              updateProgress.mutate("done");
              pushToast("Lesson marked complete", "success");
            }}
            className="text-sm px-4 py-2.5 rounded-control border border-border hover:bg-bg"
          >
            {data.progress.status === "done" ? "✓ Completed" : "Mark as Complete"}
          </button>
          <button
            onClick={() => toggleBookmark.mutate()}
            className="text-sm px-4 py-2.5 rounded-control border border-border hover:bg-bg"
          >
            {data.progress.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
        </div>

        <div className="card">
          <h3 className="font-heading font-semibold text-sm mb-2">My Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => saveNotes.mutate(notes)}
            rows={4}
            className="w-full rounded-control border p-3 text-sm"
            style={{ borderColor: "var(--color-border-strong)" }}
            placeholder="Jot down anything you want to remember…"
          />
        </div>

        <div className="card">
          <h3 className="font-heading font-semibold text-sm mb-3">Discussion</h3>
          <DiscussionThreadList courseId={data.courseId} lessonId={data.id} />
        </div>
      </div>
    </div>
  );
}
