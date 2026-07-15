import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface Sf1StudentRow {
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  sex: "M" | "F";
  birthday: string | null;
  age: number | null;
  religion: string | null;
  lrnValid: boolean;
  alreadyExists: boolean;
}

export interface Sf1PreviewResult {
  meta: {
    schoolName: string | null;
    schoolId: string | null;
    gradeLevel: string | null;
    section: string | null;
    schoolYear: string | null;
    semester: string | null;
  };
  warnings: string[];
  students: Sf1StudentRow[];
}

export function usePreviewSf1() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const token = useAuthStore.getState().accessToken;
      const res = await fetch("/api/students/import/sf1/preview", {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Preview failed");
      return res.json() as Promise<Sf1PreviewResult>;
    },
  });
}

export interface ConfirmImportResult {
  created: number;
  skipped: number;
  createdLrns: string[];
  skippedLrns: string[];
}

export interface Sf1StudentRowWithInclude extends Sf1StudentRow {
  include: boolean;
}

export function useConfirmSf1Import(courseId: string | undefined) {
  return useMutation({
    mutationFn: (payload: { gradeLevel: string; students: Sf1StudentRowWithInclude[] }) =>
      apiFetch<ConfirmImportResult>("/students/import/sf1/confirm", {
        method: "POST",
        body: JSON.stringify({ courseId, ...payload }),
      }),
  });
}
