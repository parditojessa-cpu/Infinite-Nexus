import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface StudentDashboardData {
  stats: {
    profileCompletion: number;
    attendanceRate: number;
    currentAverage: number | null;
    activeCourses: number;
  };
  courses: { id: string; title: string; subject: string; progressPercent: number }[];
  gamification: { xp: number; level: number; levelName: string; xpToNext: number };
  interventionStatus: string;
  announcements: { id: string; title: string; body: string; author: string; createdAt: string }[];
}

export interface TeacherDashboardData {
  stats: {
    students: number;
    classesToday: number;
    avgClassGrade: number | null;
    pendingToGrade: number;
  };
  classes: { id: string; title: string; subject: string }[];
  sectionsAdvised: string[];
}

export function useDashboard<T = StudentDashboardData | TeacherDashboardData>() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["dashboard", "me", userId],
    queryFn: () => apiFetch<T>("/dashboard/me"),
    enabled: !!userId,
  });
}
