import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export interface QuizQuestion {
  id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  matchingPairs: Record<string, string> | null;
  imageUrl: string | null;
  points: number;
}

export interface QuizDetail {
  id: string;
  title: string;
  timerMinutes: number;
  passingScore: number;
  maxAttempts: number;
  attemptsUsed: number;
  canAttempt: boolean;
  questions: QuizQuestion[];
}

export interface QuizListItem {
  id: string;
  title: string;
  questionCount: number;
  timerMinutes: number;
  passingScore: number;
  maxAttempts: number;
  status: string;
  myAttempts?: number;
}

export function useQuizzesForLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["quizzes", "lesson", lessonId],
    queryFn: () => apiFetch<QuizListItem[]>(`/quizzes?lessonId=${lessonId}`),
    enabled: !!lessonId,
  });
}

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: ["quizzes", quizId],
    queryFn: () => apiFetch<QuizDetail>(`/quizzes/${quizId}`),
    enabled: !!quizId,
  });
}

export function useStartAttempt(quizId: string | undefined) {
  return useMutation({
    mutationFn: () => apiFetch<{ id: string }>(`/quizzes/${quizId}/attempts`, { method: "POST" }),
  });
}

export function useSaveResponse(attemptId: string | undefined) {
  return useMutation({
    mutationFn: ({ questionId, response }: { questionId: string; response: unknown }) =>
      apiFetch(`/attempts/${attemptId}`, { method: "PATCH", body: JSON.stringify({ questionId, response }) }),
  });
}

export interface AttemptResult {
  id: string;
  score: number;
  maxScore: number;
  status: string;
}

export function useSubmitAttempt(attemptId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<AttemptResult>(`/attempts/${attemptId}/submit`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gradebook"] }),
  });
}

export interface AttemptReviewQuestion {
  id: string;
  type: string;
  prompt: string;
  points: number;
  correctAnswer: unknown;
  response: unknown;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  needsManualReview: boolean;
}

export interface AttemptReview {
  id: string;
  score: number;
  maxScore: number;
  passed: boolean | null;
  status: string;
  questions: AttemptReviewQuestion[];
}

export function useAttemptReview(attemptId: string | undefined) {
  return useQuery({
    queryKey: ["attempts", "review", attemptId],
    queryFn: () => apiFetch<AttemptReview>(`/attempts/${attemptId}/review`),
    enabled: !!attemptId,
  });
}
