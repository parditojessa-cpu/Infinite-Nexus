import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export interface AnnouncementEntry {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  commentCount: number;
  comments: { id: string; author: string; body: string; createdAt: string }[];
}

export function useAnnouncements() {
  return useQuery({ queryKey: ["announcements"], queryFn: () => apiFetch<AnnouncementEntry[]>("/announcements") });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body: string; courseId?: string }) =>
      apiFetch("/announcements", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useCommentOnAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiFetch(`/announcements/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
