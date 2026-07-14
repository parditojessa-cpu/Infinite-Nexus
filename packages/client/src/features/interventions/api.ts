import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export interface RosterEntry {
  studentId: string;
  name: string;
  riskTier: string;
  interventionStatus: string;
}

export function useRoster() {
  return useQuery({ queryKey: ["interventions", "roster"], queryFn: () => apiFetch<RosterEntry[]>("/interventions/roster") });
}

export interface StudentInterventionProfile {
  studentId: string;
  name: string;
  gradeLevel: string | null;
  riskTier: string;
  interventionStatus: string;
  stats: { average: number | null; attendanceRate: number; missingActivities: number; failedCompetencies: number };
  plans: { id: string; subject: string; status: string; competency: string | null; createdAt: string }[];
}

export function useStudentProfile(studentId: string | null) {
  return useQuery({
    queryKey: ["interventions", "student-profile", studentId],
    queryFn: () => apiFetch<StudentInterventionProfile>(`/interventions/students/${studentId}/profile`),
    enabled: !!studentId,
  });
}

export function useUpdateStudentStatus(studentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { riskTier: string; interventionStatus: string }) =>
      apiFetch(`/interventions/students/${studentId}/profile`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions", "roster"] });
      queryClient.invalidateQueries({ queryKey: ["interventions", "student-profile", studentId] });
    },
  });
}

export interface InterventionPlan {
  id: string;
  studentId: string;
  subject: string;
  teacherName: string;
  competency: string | null;
  difficulty: string | null;
  rootCauses: string[];
  strategies: string[];
  schedule: string | null;
  targetScore: number | null;
  expectedCompletion: string | null;
  remarks: string | null;
  reflection: string | null;
  finalEvaluation: string | null;
  status: string;
  createdAt: string;
}

export function usePlans(studentId?: string) {
  return useQuery({
    queryKey: ["interventions", "plans", studentId ?? "mine"],
    queryFn: () => apiFetch<InterventionPlan[]>(`/interventions/plans${studentId ? `?studentId=${studentId}` : ""}`),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/interventions/plans", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", "plans"] }),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch(`/interventions/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", "plans"] }),
  });
}

export interface InterventionActivity {
  id: string;
  title: string;
  instructions: string | null;
  materials: string[];
  deadline: string | null;
  status: string;
  teacherFeedback: string | null;
  studentReflection: string | null;
}

export function useActivities(planId: string | null) {
  return useQuery({
    queryKey: ["interventions", "activities", planId],
    queryFn: () => apiFetch<InterventionActivity[]>(`/interventions/plans/${planId}/activities`),
    enabled: !!planId,
  });
}

export function useCreateActivity(planId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; instructions: string; deadline?: string }) =>
      apiFetch(`/interventions/plans/${planId}/activities`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", "activities", planId] }),
  });
}

export function useUpdateActivity(planId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch(`/interventions/activities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions", "activities", planId] });
      queryClient.invalidateQueries({ queryKey: ["interventions", "timeline", planId] });
    },
  });
}

export interface ProgressData {
  series: Record<string, { date: string; value: number }[]>;
  radar: Record<string, number>;
}

export function usePlanProgress(planId: string | null) {
  return useQuery({
    queryKey: ["interventions", "progress", planId],
    queryFn: () => apiFetch<ProgressData>(`/interventions/plans/${planId}/progress`),
    enabled: !!planId,
  });
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  description: string;
  eventDate: string;
}

export function useTimeline(planId: string | null) {
  return useQuery({
    queryKey: ["interventions", "timeline", planId],
    queryFn: () => apiFetch<TimelineEvent[]>(`/interventions/plans/${planId}/timeline`),
    enabled: !!planId,
  });
}

export interface InterventionProgram {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  gradeLevel: string | null;
  tier: string;
  status: string;
}

export function usePrograms() {
  return useQuery({ queryKey: ["interventions", "programs"], queryFn: () => apiFetch<InterventionProgram[]>("/interventions/programs") });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiFetch("/interventions/programs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", "programs"] }),
  });
}

export function useUpdateProgramStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/interventions/programs/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", "programs"] }),
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/interventions/programs/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", "programs"] }),
  });
}
