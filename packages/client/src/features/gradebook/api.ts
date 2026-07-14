import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface GradebookRow {
  id: string;
  course: string;
  category: string;
  score: number;
  maxScore: number;
  percent: number;
  quarter: string;
  remarks: string;
}

export interface StudentGradebook {
  summary: { average: number; highest: number; lowest: number; completionRate: number };
  chartBySubject: { subject: string; average: number }[];
  rows: GradebookRow[];
}

export function useMyGradebook() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["gradebook", "me", userId],
    queryFn: () => apiFetch<StudentGradebook>("/gradebook/me"),
    enabled: !!userId,
  });
}

export interface CourseGradebookRow {
  studentId: string;
  studentName: string;
  finalGrade: number;
  remarks: string;
  rows: GradebookRow[];
}

export function useCourseGradebook(courseId: string | undefined) {
  return useQuery({
    queryKey: ["gradebook", "course", courseId],
    queryFn: () => apiFetch<CourseGradebookRow[]>(`/gradebook/course/${courseId}`),
    enabled: !!courseId,
  });
}
