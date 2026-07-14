import { useState } from "react";
import { useContacts, useConversations, useMessages, useSendMessage, useStartConversation } from "./api";

export function MessagesPage() {
  const { data: conversations } = useConversations();
  const { data: contacts } = useContacts();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages } = useMessages(activeId);
  const sendMessage = useSendMessage(activeId);
  const startConversation = useStartConversation();
  const [draft, setDraft] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const activeConversation = conversations?.find((c) => c.id === activeId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-160px)]">
      <div className={`card flex-col overflow-hidden ${activeId ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-sm">Conversations</h3>
          <button onClick={() => setShowContacts((s) => !s)} className="text-xs text-primary">
            + New
          </button>
        </div>
        {showContacts && (
          <div className="mb-2 flex flex-col gap-1 border-b border-border pb-2">
            {(contacts ?? []).map((c) => (
              <button
                key={c.id}
                onClick={async () => {
                  const conv = await startConversation.mutateAsync(c.id);
                  setActiveId(conv.id);
                  setShowContacts(false);
                }}
                className="text-left text-sm px-2 py-1.5 rounded-control hover:bg-bg"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {(conversations ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`text-left px-3 py-2 rounded-control text-sm ${activeId === c.id ? "bg-primary/10" : "hover:bg-bg"}`}
            >
              <p className="font-medium truncate">{c.participantNames}</p>
              <p className="text-xs text-text-secondary truncate">{c.lastMessage ?? "No messages yet"}</p>
            </button>
          ))}
          {(conversations ?? []).length === 0 && <p className="text-sm text-text-secondary px-2">No conversations yet.</p>}
        </div>
      </div>

      <div className={`card flex-col overflow-hidden ${activeId ? "flex" : "hidden md:flex"}`}>
        {!activeId ? (
          <p className="text-sm text-text-secondary m-auto">Select a conversation to start messaging.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2 md:hidden">
              <button onClick={() => setActiveId(null)} className="text-sm text-primary">
                ← Back
              </button>
              <span className="font-medium text-sm truncate">{activeConversation?.participantNames}</span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3">
              {(messages ?? []).map((m) => (
                <div key={m.id} className={`max-w-[70%] ${m.isMe ? "self-end" : "self-start"}`}>
                  <div
                    className={`rounded-control px-3 py-2 text-sm ${m.isMe ? "bg-primary text-white" : "bg-bg"}`}
                  >
                    {m.body}
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">{new Date(m.createdAt).toLocaleTimeString()}</p>
                </div>
              ))}
              {(messages ?? []).length === 0 && <p className="text-sm text-text-secondary">No messages yet — say hello!</p>}
            </div>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    sendMessage.mutate(draft);
                    setDraft("");
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 rounded-control border px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  if (!draft.trim()) return;
                  sendMessage.mutate(draft);
                  setDraft("");
                }}
                className="btn-primary text-sm"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
