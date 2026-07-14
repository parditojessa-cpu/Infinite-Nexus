import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface DllDocument {
  id: string;
  title: string;
  program: string;
  gradeLevel: string | null;
  learningArea: string | null;
  quarter: string | null;
  teachingDates: string | null;
  fileId: string;
  fileName: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface DllUploadFields {
  title: string;
  program: string;
  gradeLevel: string;
  learningArea: string;
  quarter: string;
  teachingDates: string;
  file: File;
}

export function useDllDocuments(courseId: string | undefined) {
  return useQuery({
    queryKey: ["dll-documents", courseId],
    queryFn: () => apiFetch<DllDocument[]>(`/dll-documents/courses/${courseId}`),
    enabled: !!courseId,
  });
}

export function useUploadDllDocument(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fields: DllUploadFields) => {
      const form = new FormData();
      form.append("title", fields.title);
      form.append("program", fields.program);
      form.append("gradeLevel", fields.gradeLevel);
      form.append("learningArea", fields.learningArea);
      form.append("quarter", fields.quarter);
      form.append("teachingDates", fields.teachingDates);
      form.append("file", fields.file);
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/dll-documents/courses/${courseId}`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dll-documents", courseId] }),
  });
}

export function useDeleteDllDocument(courseId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/dll-documents/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dll-documents", courseId] }),
  });
}
