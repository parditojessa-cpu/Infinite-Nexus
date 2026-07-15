import { useRef, useState } from "react";
import { useUiStore } from "../../lib/uiStore";
import { usePreviewSf1, useConfirmSf1Import, type Sf1StudentRowWithInclude } from "./api";

export function StudentImportPanel({ courseId }: { courseId: string }) {
  const preview = usePreviewSf1();
  const confirm = useConfirmSf1Import(courseId);
  const pushToast = useUiStore((s) => s.pushToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Sf1StudentRowWithInclude[] | null>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  async function handleFile(file: File) {
    setResult(null);
    try {
      const data = await preview.mutateAsync(file);
      setRows(data.students.map((s) => ({ ...s, include: !s.alreadyExists })));
      setGradeLevel(data.meta.gradeLevel ?? "");
      if (data.warnings.length > 0) {
        data.warnings.forEach((w) => pushToast(w, "danger"));
      }
    } catch (err: any) {
      pushToast(err.message ?? "Couldn't parse this file", "danger");
    }
  }

  function updateRow(lrn: string, patch: Partial<Sf1StudentRowWithInclude>) {
    setRows((prev) => prev?.map((r) => (r.lrn === lrn ? { ...r, ...patch } : r)) ?? null);
  }

  return (
    <div className="card">
      <h3 className="font-heading font-semibold mb-1">📋 Import Students from School Form 1</h3>
      <p className="text-xs text-text-secondary mb-4">
        Upload a DepEd School Form 1 (School Register) PDF. Each learner's LRN becomes their login ID — students log
        in with their LRN only, no password needed.
      </p>

      {!rows && (
        <>
          <button onClick={() => fileInputRef.current?.click()} disabled={preview.isPending} className="btn-primary text-sm">
            {preview.isPending ? "Reading PDF…" : "+ Upload School Form 1 (PDF)"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </>
      )}

      {rows && !result && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <span className="text-text-secondary">Grade Level for these accounts:</span>
            <input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="rounded-control border px-2 py-1 text-sm w-32"
            />
            <span className="text-text-secondary">{rows.length} learners parsed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border">
                  <th className="py-2 pr-2">Include</th>
                  <th className="py-2 pr-2">LRN</th>
                  <th className="py-2 pr-2">Last Name</th>
                  <th className="py-2 pr-2">First Name</th>
                  <th className="py-2 pr-2">Middle</th>
                  <th className="py-2 pr-2">Sex</th>
                  <th className="py-2 pr-2">Birthdate</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.lrn} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2">
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) => updateRow(r.lrn, { include: e.target.checked })}
                      />
                    </td>
                    <td className="py-1.5 pr-2 font-mono">
                      {r.lrn}
                      {!r.lrnValid && <span className="text-warning"> ⚠</span>}
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={r.lastName}
                        onChange={(e) => updateRow(r.lrn, { lastName: e.target.value })}
                        className="w-24 rounded border px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={r.firstName}
                        onChange={(e) => updateRow(r.lrn, { firstName: e.target.value })}
                        className="w-28 rounded border px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1.5 pr-2">{r.middleName ?? "—"}</td>
                    <td className="py-1.5 pr-2">{r.sex}</td>
                    <td className="py-1.5 pr-2">{r.birthday ?? "—"}</td>
                    <td className="py-1.5">
                      {r.alreadyExists ? <span className="text-warning">Already exists</span> : <span className="text-success">New</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                const res = await confirm.mutateAsync({ gradeLevel, students: rows });
                setResult(res);
                pushToast(`Created ${res.created} account(s), skipped ${res.skipped}`, "success");
              }}
              disabled={confirm.isPending}
              className="btn-primary text-sm"
            >
              {confirm.isPending ? "Creating accounts…" : `Create Accounts & Enroll (${rows.filter((r) => r.include).length})`}
            </button>
            <button
              onClick={() => {
                setRows(null);
                setResult(null);
              }}
              className="text-sm px-3 py-2 rounded-control border border-border"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <div className="rounded-control bg-success/10 text-success px-4 py-3 text-sm">
            Created {result.created} new student account(s). Skipped {result.skipped} (already had accounts — enrolled
            in this class if not already).
          </div>
          <button
            onClick={() => {
              setRows(null);
              setResult(null);
            }}
            className="text-sm px-3 py-2 rounded-control border border-border self-start"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
