import { useState } from "react";
import { useCreateThread, useDiscussions, useReply, useToggleLike } from "./api";

export function DiscussionThreadList({ courseId, lessonId }: { courseId?: string; lessonId?: string }) {
  const params = { courseId, lessonId };
  const { data, isLoading } = useDiscussions(params);
  const createThread = useCreateThread(params);
  const reply = useReply(params);
  const toggleLike = useToggleLike(params);
  const [newTitle, setNewTitle] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  if (isLoading) return <p className="text-sm text-text-secondary">Loading discussion…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Start a new question…"
          className="flex-1 rounded-control border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-strong)" }}
        />
        <button
          onClick={() => {
            if (!newTitle.trim()) return;
            createThread.mutate(newTitle);
            setNewTitle("");
          }}
          className="btn-primary text-sm px-4"
        >
          Post
        </button>
      </div>

      {(data ?? []).map((thread) => (
        <div key={thread.id} className="border border-border rounded-control p-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{thread.title}</p>
            {thread.pinned && <span className="text-xs">📌</span>}
          </div>
          <p className="text-xs text-text-secondary mb-2">{thread.author}</p>
          <button
            onClick={() => toggleLike.mutate(thread.id)}
            className={`text-xs mb-2 ${thread.likedByMe ? "text-primary font-semibold" : "text-text-secondary"}`}
          >
            👍 {thread.likeCount}
          </button>
          <div className="flex flex-col gap-2 mb-2">
            {thread.replies.map((r) => (
              <div key={r.id} className="bg-bg rounded-control px-3 py-2 text-sm">
                <span className="font-medium">{r.author}: </span>
                {r.body}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={replyDrafts[thread.id] ?? ""}
              onChange={(e) => setReplyDrafts((d) => ({ ...d, [thread.id]: e.target.value }))}
              placeholder="Reply…"
              className="flex-1 rounded-control border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--color-border-strong)" }}
            />
            <button
              onClick={() => {
                const body = replyDrafts[thread.id];
                if (!body?.trim()) return;
                reply.mutate({ threadId: thread.id, body });
                setReplyDrafts((d) => ({ ...d, [thread.id]: "" }));
              }}
              className="text-sm px-3 py-1.5 rounded-control border border-border hover:bg-bg"
            >
              Reply
            </button>
          </div>
        </div>
      ))}
      {(data ?? []).length === 0 && <p className="text-sm text-text-secondary">No discussion yet — be the first to post.</p>}
    </div>
  );
}
