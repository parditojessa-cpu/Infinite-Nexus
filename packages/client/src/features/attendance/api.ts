import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface AttendanceHistoryEntry {
  id: string;
  date: string;
  subject: string;
  status: string;
}

export function useMyAttendance() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["attendance", "me", userId],
    queryFn: () => apiFetch<{ attendanceRate: number; history: AttendanceHistoryEntry[] }>("/attendance/me"),
    enabled: !!userId,
  });
}

export interface RosterEntry {
  studentId: string;
  studentName: string;
  status: string | null;
}

export function useCourseRoster(courseId: string | undefined, date: string) {
  return useQuery({
    queryKey: ["attendance", "course", courseId, date],
    queryFn: () => apiFetch<RosterEntry[]>(`/attendance/course/${courseId}?date=${date}`),
    enabled: !!courseId,
  });
}

export function useSaveAttendance(courseId: string | undefined, date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (records: { studentId: string; status: string }[]) =>
      apiFetch(`/attendance/course/${courseId}`, { method: "PUT", body: JSON.stringify({ date, records }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "course", courseId, date] }),
  });
}

export interface AttendanceReportRow {
  studentName: string;
  attendanceRate: number;
  totalDays: number;
}

export function useAttendanceReport() {
  return useMutation({
    mutationFn: (courseId: string) => apiFetch<AttendanceReportRow[]>(`/attendance/report?courseId=${courseId}`),
  });
}
