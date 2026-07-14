import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface StudentProfileData {
  user: { id: string; email: string | null; studentId: string | null; firstName: string; lastName: string; avatarUrl: string | null };
  studentProfile: {
    lrn: string | null;
    gradeLevel: string | null;
    strand: string | null;
    schoolYear: string | null;
    semester: string | null;
    gender: string | null;
    birthday: string | null;
    address: string | null;
    contactNumber: string | null;
    parentName: string | null;
    parentContact: string | null;
    section: { name: string; adviserId: string } | null;
  } | null;
  interventionProfile: {
    riskTier: string;
    interventionStatus: string;
    stats: { average: number | null; attendanceRate: number; missingActivities: number; failedCompetencies: number };
    activePlan: {
      status: string;
      program: string;
      assignedTeacher: string;
      targetScore: number | null;
      expectedCompletion: string | null;
    } | null;
  };
}

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["profile", "me", userId],
    queryFn: () => apiFetch<StudentProfileData>("/users/me/profile"),
    enabled: !!userId,
  });
}
