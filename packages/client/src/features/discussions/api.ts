import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export interface DiscussionThreadData {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  author: string;
  likeCount: number;
  likedByMe: boolean;
  replies: { id: string; body: string; author: string; createdAt: string }[];
}

export function useDiscussions(params: { courseId?: string; lessonId?: string }) {
  const query = new URLSearchParams();
  if (params.courseId) query.set("courseId", params.courseId);
  if (params.lessonId) query.set("lessonId", params.lessonId);
  const qs = query.toString();

  return useQuery({
    queryKey: ["discussions", params.courseId ?? null, params.lessonId ?? null],
    queryFn: () => apiFetch<DiscussionThreadData[]>(`/discussions${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateThread(params: { courseId?: string; lessonId?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      apiFetch("/discussions", { method: "POST", body: JSON.stringify({ ...params, title }) }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["discussions", params.courseId ?? null, params.lessonId ?? null] }),
  });
}

export function useReply(params: { courseId?: string; lessonId?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      apiFetch(`/discussions/${threadId}/replies`, { method: "POST", body: JSON.stringify({ body }) }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["discussions", params.courseId ?? null, params.lessonId ?? null] }),
  });
}

export function useToggleLike(params: { courseId?: string; lessonId?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => apiFetch(`/discussions/${threadId}/like`, { method: "POST" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["discussions", params.courseId ?? null, params.lessonId ?? null] }),
  });
}
