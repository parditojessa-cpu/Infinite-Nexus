import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export interface GamificationData {
  xp: number;
  level: number;
  levelName: string;
  xpToNext: number;
  nextLevelXp: number | null;
  sectionId: string | null;
  ladder: { level: number; name: string; xpRequired: number }[];
  badges: { id: string; name: string; description: string; icon: string; earned: boolean; earnedAt: string | null }[];
}

export function useGamification() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["gamification", "me", userId],
    queryFn: () => apiFetch<GamificationData>("/gamification/me"),
    enabled: !!userId,
  });
}

export interface LeaderboardEntry {
  studentId: string;
  name: string;
  xp: number;
  level: number;
  rank: number;
  isMe: boolean;
}

export function useLeaderboard(sectionId: string | undefined) {
  return useQuery({
    queryKey: ["gamification", "leaderboard", sectionId],
    queryFn: () => apiFetch<LeaderboardEntry[]>(`/gamification/leaderboard/${sectionId}`),
    enabled: !!sectionId,
  });
}
