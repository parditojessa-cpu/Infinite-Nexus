import { useRef, useState } from "react";
import { downloadAuthedFile } from "../../lib/download";
import { useUiStore } from "../../lib/uiStore";
import { Badge } from "../../components/Badge";
import { useDeleteDllDocument, useDllDocuments, useUploadDllDocument } from "./api";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const emptyForm = { title: "", program: "ILAW", gradeLevel: "", learningArea: "", quarter: "", teachingDates: "" };

export function DllLibraryPanel({ courseId }: { courseId: string }) {
  const { data: documents, isLoading } = useDllDocuments(courseId);
  const upload = useUploadDllDocument(courseId);
  const del = useDeleteDllDocument(courseId);
  const pushToast = useUiStore((s) => s.pushToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);

  const setField = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-heading font-semibold">📁 Daily Lesson Logs</h3>
        <Badge label="ILAW Program" color="var(--color-primary)" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-secondary">DepEd Philippines · ILAW Program · Standard DLL format</p>
        <button
          onClick={() => downloadAuthedFile("/api/dll-documents/template", "ILAW-DLL-Template.docx")}
          className="text-xs px-3 py-1.5 rounded-control border border-border hover:bg-bg"
        >
          ⬇ Download Blank DLL Template
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <input
          value={form.title}
          onChange={setField("title")}
          placeholder="Title (e.g. Week 1)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.learningArea}
          onChange={setField("learningArea")}
          placeholder="Learning Area (e.g. Practical Research 2)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.gradeLevel}
          onChange={setField("gradeLevel")}
          placeholder="Grade Level (e.g. 12)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.quarter}
          onChange={setField("quarter")}
          placeholder="Quarter/Term (e.g. 1)"
          className="rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <input
          value={form.teachingDates}
          onChange={setField("teachingDates")}
          placeholder="Teaching Dates (e.g. June 15-19, 2026)"
          className="rounded-control border px-3 py-2 text-sm sm:col-span-2"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!form.title.trim()}
          className="btn-primary text-sm disabled:opacity-50"
        >
          + Upload DLL
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await upload.mutateAsync({ ...form, file });
              pushToast("Daily Lesson Log uploaded", "success");
              setForm(emptyForm);
            } catch {
              pushToast("Upload failed", "danger");
            }
            e.target.value = "";
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-1">
          {(documents ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between border-b border-border last:border-0 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">📄 {d.title}</p>
                  <Badge label={d.program} color="var(--color-accent)" />
                </div>
                <p className="text-xs text-text-secondary">
                  {[d.learningArea, d.gradeLevel && `Grade ${d.gradeLevel}`, d.quarter && `Q${d.quarter}`, d.teachingDates]
                    .filter(Boolean)
                    .join(" · ") || "No metadata"}
                </p>
                <p className="text-xs text-text-secondary">
                  {d.uploadedBy} · {formatSize(d.size)} · {new Date(d.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => downloadAuthedFile(`/api/files/${d.fileId}`, d.fileName)}
                  className="text-xs px-2.5 py-1 rounded-control border border-border hover:bg-bg"
                >
                  Download
                </button>
                <button
                  onClick={() => del.mutate(d.id)}
                  className="text-xs px-2.5 py-1 rounded-control border border-border text-danger hover:bg-bg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {(documents ?? []).length === 0 && (
            <p className="text-sm text-text-secondary">No Daily Lesson Logs uploaded yet for this course.</p>
          )}
        </div>
      )}
    </div>
  );
}
