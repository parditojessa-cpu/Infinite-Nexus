import { useAuthStore } from "../../lib/authStore";
import { useDashboard, type StudentDashboardData, type TeacherDashboardData } from "./api";
import { StudentDashboard } from "./StudentDashboard";
import { TeacherDashboard } from "./TeacherDashboard";

export function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <p className="text-sm text-text-secondary">Loading dashboard…</p>;
  if (isError || !data) return <p className="text-sm text-danger">Couldn't load your dashboard.</p>;

  return role === "teacher" ? (
    <TeacherDashboard data={data as TeacherDashboardData} />
  ) : (
    <StudentDashboard data={data as StudentDashboardData} />
  );
}
