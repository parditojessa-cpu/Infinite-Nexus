import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface WhiteboardSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardMessage {
  id: string;
  sessionId: string;
  role: "student" | "ai";
  content: string;
  createdAt: string;
}

export interface WhiteboardSessionDetail extends WhiteboardSession {
  messages: WhiteboardMessage[];
}

export function useWhiteboardSessions() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["whiteboard", "sessions", userId],
    queryFn: () => apiFetch<WhiteboardSession[]>("/whiteboard/sessions"),
    enabled: !!userId,
  });
}

export function useWhiteboardSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["whiteboard", "session", sessionId],
    queryFn: () => apiFetch<WhiteboardSessionDetail>(`/whiteboard/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useCreateWhiteboardSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<WhiteboardSession>("/whiteboard/sessions", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whiteboard", "sessions"] }),
  });
}

export function useSendWhiteboardMessage(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ studentMessage: WhiteboardMessage; aiMessage: WhiteboardMessage }>(
        `/whiteboard/sessions/${sessionId}/messages`,
        { method: "POST", body: JSON.stringify({ content }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whiteboard", "session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["whiteboard", "sessions"] });
    },
  });
}

export function useDeleteWhiteboardSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiFetch(`/whiteboard/sessions/${sessionId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whiteboard", "sessions"] }),
  });
}
