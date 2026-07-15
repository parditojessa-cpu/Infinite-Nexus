import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateWhiteboardSession,
  useDeleteWhiteboardSession,
  useSendWhiteboardMessage,
  useWhiteboardSession,
  useWhiteboardSessions,
} from "./api";
import { useUiStore } from "../../lib/uiStore";
import { ApiError } from "../../lib/api";

export function WhiteboardPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((s) => s.pushToast);

  const { data: sessions } = useWhiteboardSessions();
  const { data: session } = useWhiteboardSession(sessionId);
  const createSession = useCreateWhiteboardSession();
  const deleteSession = useDeleteWhiteboardSession();
  const sendMessage = useSendWhiteboardMessage(sessionId);
  const [draft, setDraft] = useState("");

  async function handleNewProblem() {
    const created = await createSession.mutateAsync();
    navigate(`/student/whiteboard/${created.id}`);
  }

  async function handleSend() {
    if (!draft.trim() || !sessionId) return;
    const content = draft;
    setDraft("");
    try {
      await sendMessage.mutateAsync(content);
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : "The AI Whiteboard couldn't respond — try again.", "danger");
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-160px)]">
      <div className={`card flex-col overflow-hidden ${sessionId ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-sm">AI Whiteboard</h3>
          <button onClick={handleNewProblem} disabled={createSession.isPending} className="text-xs text-primary">
            + New Problem
          </button>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {(sessions ?? []).map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 rounded-control ${sessionId === s.id ? "bg-primary/10" : "hover:bg-bg"}`}
            >
              <button
                onClick={() => navigate(`/student/whiteboard/${s.id}`)}
                className="flex-1 text-left px-3 py-2 text-sm truncate"
              >
                {s.title}
              </button>
              <button
                onClick={() => {
                  deleteSession.mutate(s.id);
                  if (sessionId === s.id) navigate("/student/whiteboard");
                }}
                className="text-text-secondary hover:text-danger px-2 text-xs"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
          {(sessions ?? []).length === 0 && (
            <p className="text-sm text-text-secondary px-2">No problems yet — start a new one!</p>
          )}
        </div>
      </div>

      <div className={`card flex-col overflow-hidden ${sessionId ? "flex" : "hidden md:flex"}`}>
        {!sessionId ? (
          <div className="m-auto text-center max-w-sm">
            <p className="text-sm text-text-secondary mb-3">
              Type a problem — math, science, anything — and the AI Whiteboard will walk you through it step by step.
            </p>
            <button onClick={handleNewProblem} className="btn-primary text-sm">
              + New Problem
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2 md:hidden">
              <button onClick={() => navigate("/student/whiteboard")} className="text-sm text-primary">
                ← Back
              </button>
              <span className="font-medium text-sm truncate">{session?.title}</span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3">
              {(session?.messages ?? []).map((m) => (
                <div key={m.id} className={`max-w-[85%] ${m.role === "student" ? "self-end" : "self-start"}`}>
                  <div
                    className={`rounded-control px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "student" ? "bg-primary text-white" : "bg-bg"
                    }`}
                  >
                    {m.content}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {(session?.messages ?? []).length === 0 && (
                <p className="text-sm text-text-secondary">Type your problem below to get started.</p>
              )}
              {sendMessage.isPending && (
                <div className="self-start max-w-[85%]">
                  <div className="rounded-control px-3 py-2 text-sm bg-bg text-text-secondary italic">
                    Thinking through the steps…
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !sendMessage.isPending) handleSend();
                }}
                placeholder="Type a problem, e.g. 2x + 5 = 15"
                className="flex-1 rounded-control border px-3 py-2 text-sm"
                disabled={sendMessage.isPending}
              />
              <button onClick={handleSend} disabled={sendMessage.isPending} className="btn-primary text-sm">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
