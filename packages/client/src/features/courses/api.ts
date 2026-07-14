import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface CourseSummary {
  id: string;
  title: string;
  subject: string;
  teacherName?: string;
  studentCount?: number;
  progressPercent?: number;
  lessonCount: number;
  moduleCount: number;
}

export interface LessonSummary {
  id: string;
  title: string;
  status: string;
  progressStatus: string;
}

export interface ModuleSummary {
  id: string;
  title: string;
  status: string;
  lessons: LessonSummary[];
}

export interface CourseDetail {
  id: string;
  title: string;
  subject: string;
  modules: ModuleSummary[];
}

export function useCourses() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["courses", "mine", userId],
    queryFn: () => apiFetch<CourseSummary[]>("/courses"),
    enabled: !!userId,
  });
}

export function useCourseDetail(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => apiFetch<CourseDetail>(`/courses/${courseId}`),
    enabled: !!courseId,
  });
}
