import { useState } from "react";
import { useAuthStore } from "../../lib/authStore";
import { useCourses } from "../courses/api";
import { useAnnouncements, useCommentOnAnnouncement, useCreateAnnouncement } from "./api";

function ComposeForm() {
  const { data: courses } = useCourses();
  const create = useCreateAnnouncement();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [courseId, setCourseId] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm self-start">
        + New Announcement
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-2">
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="rounded-control border px-3 py-2 text-sm">
        <option value="">All my classes</option>
        {courses?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-control border px-3 py-2 text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={3} className="rounded-control border px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button
          onClick={async () => {
            await create.mutateAsync({ title, body, courseId: courseId || undefined });
            setTitle("");
            setBody("");
            setOpen(false);
          }}
          disabled={!title || !body}
          className="btn-primary text-sm"
        >
          Post
        </button>
        <button onClick={() => setOpen(false)} className="text-sm px-3 py-2 rounded-control border border-border">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AnnouncementsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = useAnnouncements();
  const comment = useCommentOnAnnouncement();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (isLoading) return <p className="text-sm text-text-secondary">Loading announcements…</p>;

  return (
    <div className="flex flex-col gap-4">
      {role === "teacher" && <ComposeForm />}
      {(data ?? []).map((a) => (
        <div key={a.id} className="card">
          <h3 className="font-heading font-semibold text-sm">{a.title}</h3>
          <p className="text-xs text-text-secondary mb-2">
            {a.author} · {new Date(a.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm mb-3">{a.body}</p>
          <div className="flex flex-col gap-2 mb-2">
            {a.comments.map((c) => (
              <div key={c.id} className="bg-bg rounded-control px-3 py-2 text-sm">
                <span className="font-medium">{c.author}: </span>
                {c.body}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={drafts[a.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
              placeholder="Add a comment…"
              className="flex-1 rounded-control border px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => {
                const body = drafts[a.id];
                if (!body?.trim()) return;
                comment.mutate({ id: a.id, body });
                setDrafts((d) => ({ ...d, [a.id]: "" }));
              }}
              className="text-sm px-3 py-1.5 rounded-control border border-border hover:bg-bg"
            >
              Comment
            </button>
          </div>
        </div>
      ))}
      {(data ?? []).length === 0 && <p className="text-sm text-text-secondary">No announcements yet.</p>}
    </div>
  );
}
