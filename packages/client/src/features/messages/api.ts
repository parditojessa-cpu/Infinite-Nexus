import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface Conversation {
  id: string;
  participantNames: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export function useConversations() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["messages", "conversations", userId],
    queryFn: () => apiFetch<Conversation[]>("/messages/conversations"),
    enabled: !!userId,
    refetchInterval: 20000,
  });
}

export interface Contact {
  id: string;
  name: string;
}

export function useContacts() {
  return useQuery({ queryKey: ["messages", "contacts"], queryFn: () => apiFetch<Contact[]>("/messages/contacts") });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientId: string) => apiFetch<{ id: string }>("/messages/conversations", { method: "POST", body: JSON.stringify({ recipientId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] }),
  });
}

export interface MessageEntry {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  isMe: boolean;
  createdAt: string;
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", "thread", conversationId],
    queryFn: () => apiFetch<MessageEntry[]>(`/messages/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => apiFetch(`/messages/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "thread", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
    },
  });
}
