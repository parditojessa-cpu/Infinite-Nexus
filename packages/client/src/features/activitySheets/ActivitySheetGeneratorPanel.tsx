import { useState } from "react";
import { downloadAuthedFile } from "../../lib/download";
import { useUiStore } from "../../lib/uiStore";
import { ApiError } from "../../lib/api";
import { useActivitySheets, useDeleteActivitySheet, useGenerateActivitySheet } from "./api";

const emptyForm = {
  title: "",
  topic: "",
  gradeLevel: "",
  learningArea: "",
  competency: "",
  numItems: 10,
  difficulty: "average" as const,
};

export function ActivitySheetGeneratorPanel({ courseId }: { courseId: string }) {
  const { data: sheets, isLoading } = useActivitySheets(courseId);
  const generate = useGenerateActivitySheet(courseId);
  const del = useDeleteActivitySheet(courseId);
  const pushToast = useUiStore((s) => s.pushToast);
  const [form, setForm] = useState(emptyForm);

  const setField =
    (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleGenerate() {
    if (!form.title.trim() || !form.topic.trim()) return;
    try {
      await generate.mutateAsync({ ...form, numItems: Number(form.numItems) });
      pushToast("Activity sheet generated", "success");
      setForm(emptyForm);
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : "Couldn't generate the activity sheet", "danger");
    }
  }

  return (
    <div className="card">
      <h3 className="font-heading font-semibold mb-1">🧠 AI Activity Sheet Generator</h3>
      <p className="text-xs text-text-secondary mb-3">
        Describe a topic and the AI will draft practice questions, then render them into a printable PDF with an
        answer key.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <input
          value={form.title}
          onChange={setField("title")}
          placeholder="Title (e.g. Functions Practice Set)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.topic}
          onChange={setField("topic")}
          placeholder="Topic (e.g. Domain and range of functions)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.gradeLevel}
          onChange={setField("gradeLevel")}
          placeholder="Grade Level (e.g. 11)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.learningArea}
          onChange={setField("learningArea")}
          placeholder="Learning Area (e.g. General Mathematics)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.competency}
          onChange={setField("competency")}
          placeholder="Competency (optional)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={30}
            value={form.numItems}
            onChange={setField("numItems")}
            placeholder="# Items"
            className="w-24 rounded-control border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border-strong)" }}
          />
          <select
            value={form.difficulty}
            onChange={setField("difficulty")}
            className="flex-1 rounded-control border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border-strong)" }}
          >
            <option value="easy">Easy</option>
            <option value="average">Average</option>
            <option value="challenging">Challenging</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!form.title.trim() || !form.topic.trim() || generate.isPending}
        className="btn-primary text-sm disabled:opacity-50 mb-4"
      >
        {generate.isPending ? "Generating…" : "✨ Generate Activity Sheet"}
      </button>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-1">
          {(sheets ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border last:border-0 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">📄 {s.title}</p>
                <p className="text-xs text-text-secondary">
                  {[s.learningArea, s.gradeLevel && `Grade ${s.gradeLevel}`, `${s.numItems} items`, s.difficulty]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-xs text-text-secondary">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => downloadAuthedFile(`/api/files/${s.fileId}`, s.fileName)}
                  className="text-xs px-2.5 py-1 rounded-control border border-border hover:bg-bg"
                >
                  Download
                </button>
                <button
                  onClick={() => del.mutate(s.id)}
                  className="text-xs px-2.5 py-1 rounded-control border border-border text-danger hover:bg-bg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {(sheets ?? []).length === 0 && (
            <p className="text-sm text-text-secondary">No activity sheets generated yet for this course.</p>
          )}
        </div>
      )}
    </div>
  );
}
