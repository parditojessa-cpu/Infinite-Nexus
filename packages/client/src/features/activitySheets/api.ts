import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export interface ActivitySheet {
  id: string;
  title: string;
  topic: string;
  gradeLevel: string | null;
  learningArea: string | null;
  competency: string | null;
  numItems: number;
  difficulty: string;
  fileId: string;
  fileName: string;
  createdAt: string;
}

export interface GenerateActivitySheetFields {
  title: string;
  topic: string;
  gradeLevel: string;
  learningArea: string;
  competency: string;
  numItems: number;
  difficulty: "easy" | "average" | "challenging";
}

export function useActivitySheets(courseId: string | undefined) {
  return useQuery({
    queryKey: ["activity-sheets", courseId],
    queryFn: () => apiFetch<ActivitySheet[]>(`/activity-sheets/courses/${courseId}`),
    enabled: !!courseId,
  });
}

export function useGenerateActivitySheet(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fields: GenerateActivitySheetFields) =>
      apiFetch<ActivitySheet>(`/activity-sheets/courses/${courseId}`, {
        method: "POST",
        body: JSON.stringify(fields),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activity-sheets", courseId] }),
  });
}

export function useDeleteActivitySheet(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/activity-sheets/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activity-sheets", courseId] }),
  });
}
