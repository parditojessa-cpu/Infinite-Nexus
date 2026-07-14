import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface AssignmentSummary {
  id: string;
  title: string;
  courseName: string;
  dueDate: string | null;
  pointsPossible: number;
  status?: string;
  score?: number | null;
  feedback?: string | null;
  hasRubric?: boolean;
  submissionCount?: number;
  gradedCount?: number;
}

export function useAssignments() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["assignments", userId],
    queryFn: () => apiFetch<AssignmentSummary[]>("/assignments"),
    enabled: !!userId,
  });
}

export function useSubmitAssignment(assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note: string) => {
      const form = new FormData();
      form.append("note", note);
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Submission failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export interface SubmissionRow {
  id: string;
  studentName: string;
  submittedAt: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  note: string | null;
}

export function useAssignmentSubmissions(assignmentId: string | null) {
  return useQuery({
    queryKey: ["assignments", "submissions", assignmentId],
    queryFn: () => apiFetch<SubmissionRow[]>(`/assignments/${assignmentId}/submissions`),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, score, feedback }: { submissionId: string; score: number; feedback: string }) =>
      apiFetch(`/assignments/submissions/${submissionId}/grade`, {
        method: "PATCH",
        body: JSON.stringify({ score, feedback }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}
