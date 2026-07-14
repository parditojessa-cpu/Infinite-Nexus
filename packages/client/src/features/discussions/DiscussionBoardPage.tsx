import { useState } from "react";
import { useCreateThread, useDiscussions, useReply, useToggleLike } from "./api";

const PAGE_SIZE = 2;

export function DiscussionBoardPage() {
  const params = {};
  const { data, isLoading } = useDiscussions(params);
  const createThread = useCreateThread(params);
  const reply = useReply(params);
  const toggleLike = useToggleLike(params);
  const [newTitle, setNewTitle] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  if (isLoading) return <p className="text-sm text-text-secondary">Loading discussion board…</p>;

  const threads = data ?? [];
  const totalPages = Math.max(1, Math.ceil(threads.length / PAGE_SIZE));
  const pageThreads = threads.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Start a new discussion…"
          className="flex-1 rounded-control border px-3 py-2 text-sm"
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

      {pageThreads.map((thread) => (
        <div key={thread.id} className="card">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">{thread.title}</p>
            {thread.pinned && <span className="text-xs">📌</span>}
          </div>
          <p className="text-xs text-text-secondary mb-2">{thread.author}</p>
          <button
            onClick={() => toggleLike.mutate(thread.id)}
            className={`text-xs mb-2 ${thread.likedByMe ? "text-primary font-semibold" : "text-text-secondary"}`}
          >
            👍 {thread.likeCount} · {thread.replies.length} replies
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
      {threads.length === 0 && <p className="text-sm text-text-secondary">No discussions yet — start one above.</p>}

      {threads.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-control border border-border disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-text-secondary">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-control border border-border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
