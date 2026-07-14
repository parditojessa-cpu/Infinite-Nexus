import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface ProgressData {
  improvement: { weekly: number; monthly: number; yearly: number };
  charts: {
    gradesTrend: { label: string; value: number }[];
    attendanceTrend: { label: string; value: number }[];
    quizPerformance: { label: string; value: number }[];
    assignmentCompletion: { label: string; value: number }[];
  };
  competencyMastery: Record<string, number>;
  learningProgress: number;
  interventionStatus: string;
}

export function useProgress() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["progress", "me", userId],
    queryFn: () => apiFetch<ProgressData>("/progress/me"),
    enabled: !!userId,
  });
}
