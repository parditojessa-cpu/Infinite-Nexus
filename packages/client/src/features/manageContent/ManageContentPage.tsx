import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { LESSON_RESOURCE_TYPE_LABELS, LESSON_RESOURCE_TYPES } from "@finite-nexus/shared";
import { useCourseDetail } from "../courses/api";
import { useLesson } from "../lessons/api";
import { useUiStore } from "../../lib/uiStore";
import { useCreateLesson, useCreateModule, useToggleModuleStatus, useUploadResource } from "./api";
import { DllLibraryPanel } from "../dllLibrary/DllLibraryPanel";
import { StudentImportPanel } from "../studentImport/StudentImportPanel";

const TABS = ["Lesson Materials", "DLL Library", "Import Students (SF1)"] as const;

export function ManageContentPage() {
  const { courseId } = useParams();
  const { data: course, isLoading } = useCourseDetail(courseId);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<(typeof TABS)[number]>("Lesson Materials");
  const pushToast = useUiStore((s) => s.pushToast);

  const createModule = useCreateModule(courseId);
  const createLesson = useCreateLesson(courseId);
  const toggleStatus = useToggleModuleStatus(courseId);
  const { data: lessonDetail } = useLesson(selectedLessonId ?? undefined);
  const uploadResource = useUploadResource(selectedLessonId ?? undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (!course || !courseId) return <p className="text-sm text-danger">Couldn't load this class.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-heading font-bold text-lg">{course.title}</h2>
          <p className="text-sm text-text-secondary">{course.subject}</p>
        </div>
        {tab === "Lesson Materials" && (
          <div className="flex gap-2">
            <input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="New module title"
              className="rounded-control border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-border-strong)" }}
            />
            <button
              onClick={() => {
                if (!newModuleTitle.trim()) return;
                createModule.mutate(newModuleTitle);
                setNewModuleTitle("");
              }}
              className="btn-primary text-sm"
            >
              + Add Module
            </button>
          </div>
        )}
      </div>

      <div className="flex rounded-pill bg-bg p-1 w-fit text-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-pill ${tab === t ? "bg-primary text-white" : "text-text-secondary"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "DLL Library" && <DllLibraryPanel courseId={courseId} />}
      {tab === "Import Students (SF1)" && <StudentImportPanel courseId={courseId} />}

      {tab === "Lesson Materials" && (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        <div className="card">
          <h3 className="font-heading font-semibold mb-3">Modules &amp; Lessons</h3>
          <div className="flex flex-col gap-4">
            {course.modules.map((m) => (
              <div key={m.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{m.title}</span>
                  <button
                    onClick={() => toggleStatus.mutate({ moduleId: m.id, status: m.status === "draft" ? "published" : "draft" })}
                    className={`text-[10px] uppercase px-2 py-0.5 rounded-pill ${
                      m.status === "published" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}
                  >
                    {m.status}
                  </button>
                </div>
                <div className="flex flex-col gap-1 ml-2 mb-2">
                  {m.lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLessonId(l.id)}
                      className={`text-left text-sm px-2 py-1.5 rounded-control ${
                        selectedLessonId === l.id ? "bg-primary text-white" : "hover:bg-bg"
                      }`}
                    >
                      {l.title}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 ml-2">
                  <input
                    value={newLessonTitle[m.id] ?? ""}
                    onChange={(e) => setNewLessonTitle((d) => ({ ...d, [m.id]: e.target.value }))}
                    placeholder="New lesson title"
                    className="flex-1 rounded-control border px-2 py-1.5 text-xs"
                    style={{ borderColor: "var(--color-border-strong)" }}
                  />
                  <button
                    onClick={() => {
                      const title = newLessonTitle[m.id];
                      if (!title?.trim()) return;
                      createLesson.mutate({ moduleId: m.id, title });
                      setNewLessonTitle((d) => ({ ...d, [m.id]: "" }));
                    }}
                    className="text-xs px-3 py-1.5 rounded-control border border-border hover:bg-bg"
                  >
                    + Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {!selectedLessonId ? (
            <p className="text-sm text-text-secondary">Select a lesson to manage its materials.</p>
          ) : (
            <>
              <h3 className="font-heading font-semibold mb-3">Upload Learning Materials</h3>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {LESSON_RESOURCE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setPendingType(type);
                      fileInputRef.current?.click();
                    }}
                    className="border border-dashed rounded-control py-3 text-xs text-center hover:bg-bg"
                    style={{ borderColor: "var(--color-border-strong)" }}
                  >
                    {LESSON_RESOURCE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !pendingType) return;
                  try {
                    await uploadResource.mutateAsync({ type: pendingType, file });
                    pushToast("Material uploaded", "success");
                  } catch {
                    pushToast("Upload failed", "danger");
                  }
                  e.target.value = "";
                }}
              />

              <h3 className="font-heading font-semibold mb-2">Uploaded Resources</h3>
              <div className="flex flex-col gap-1">
                {(lessonDetail?.resources ?? []).map((r) => (
                  <div key={r.id} className="flex justify-between text-sm border-b border-border last:border-0 py-2">
                    <span>📄 {r.title}</span>
                    <span className="text-xs text-text-secondary">{LESSON_RESOURCE_TYPE_LABELS[r.type] ?? r.type}</span>
                  </div>
                ))}
                {(lessonDetail?.resources ?? []).length === 0 && (
                  <p className="text-sm text-text-secondary">No materials uploaded yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
