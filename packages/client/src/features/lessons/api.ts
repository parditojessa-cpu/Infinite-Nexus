import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export interface LessonDetail {
  id: string;
  title: string;
  status: string;
  learningCompetency: string | null;
  objectives: string[];
  videoUrl: string | null;
  examples: string[];
  lessonNotes: string | null;
  assessment: string | null;
  reflectionPrompt: string | null;
  references: string[];
  resources: { id: string; type: string; title: string; fileId: string | null; fileName?: string }[];
  siblingLessons: { id: string; title: string }[];
  courseId: string;
  moduleTitle: string;
  progress: { status: string; bookmarked: boolean; studentNotes: string };
}

export function useLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lessons", lessonId],
    queryFn: () => apiFetch<LessonDetail>(`/lessons/${lessonId}`),
    enabled: !!lessonId,
  });
}

export function useUpdateLessonProgress(lessonId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      apiFetch(`/lessons/${lessonId}/progress`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] }),
  });
}

export function useToggleBookmark(lessonId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/lessons/${lessonId}/bookmark`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] }),
  });
}

export function useSaveNotes(lessonId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: string) => apiFetch(`/lessons/${lessonId}/notes`, { method: "PUT", body: JSON.stringify({ notes }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] }),
  });
}
