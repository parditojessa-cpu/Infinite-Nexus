import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface CertificateEntry {
  type: string;
  label: string;
  earned: boolean;
  certificateId: string | null;
  earnedAt: string | null;
}

export function useCertificates() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["certificates", "me", userId],
    queryFn: () => apiFetch<CertificateEntry[]>("/certificates/me"),
    enabled: !!userId,
  });
}
