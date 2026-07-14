import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export function useCreateModule(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      apiFetch(`/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify({ title }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", "detail", courseId] }),
  });
}

export function useCreateLesson(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, title }: { moduleId: string; title: string }) =>
      apiFetch(`/modules/${moduleId}/lessons`, { method: "POST", body: JSON.stringify({ title }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", "detail", courseId] }),
  });
}

export function useToggleModuleStatus(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, status }: { moduleId: string; status: string }) =>
      apiFetch(`/modules/${moduleId}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", "detail", courseId] }),
  });
}

export function useUploadResource(lessonId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, file }: { type: string; file: File }) => {
      const form = new FormData();
      form.append("type", type);
      form.append("title", file.name);
      form.append("file", file);
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/lessons/${lessonId}/resources`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] }),
  });
}
