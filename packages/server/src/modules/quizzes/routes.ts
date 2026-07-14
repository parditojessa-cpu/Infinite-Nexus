import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { gradeResponse } from "./grading.js";
import { awardXp } from "../../lib/xpEngine.js";
import { checkAndTriggerIntervention } from "../../lib/interventionEngine.js";
import { XP_RULES } from "@finite-nexus/shared";

export const quizzesRouter = Router();

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

quizzesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { courseId, lessonId } = req.query as { courseId?: string; lessonId?: string };
    const quizzes = await prisma.quiz.findMany({
      where: { ...(courseId ? { courseId } : {}), ...(lessonId ? { lessonId } : {}) },
      include: { questions: true, attempts: req.user!.role === "student" ? { where: { studentId: req.user!.userId } } : true },
    });
    return res.json(
      quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        questionCount: q.questions.length,
        timerMinutes: q.timerMinutes,
        passingScore: q.passingScore,
        maxAttempts: q.maxAttempts,
        status: q.status,
        myAttempts: req.user!.role === "student" ? q.attempts.length : undefined,
      }))
    );
  })
);

quizzesRouter.post(
  "/",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { courseId, lessonId, title, timerMinutes, passingScore, maxAttempts, shuffle, questions } = req.body;
    const parsedTimer = Number(timerMinutes);
    if (!Number.isFinite(parsedTimer) || parsedTimer <= 0) {
      return res.status(400).json({ error: "All written activities require a time limit (timerMinutes > 0)." });
    }
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        lessonId: lessonId ?? null,
        title,
        timerMinutes: parsedTimer,
        passingScore: passingScore ?? 75,
        maxAttempts: maxAttempts ?? 1,
        shuffle: !!shuffle,
        status: "published",
        questions: {
          create: (questions ?? []).map((q: any, i: number) => ({
            orderIndex: i,
            type: q.type,
            prompt: q.prompt,
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: q.correctAnswer !== undefined ? JSON.stringify(q.correctAnswer) : null,
            points: q.points ?? 1,
            imageUrl: q.imageUrl ?? null,
            matchingPairs: q.matchingPairs ? JSON.stringify(q.matchingPairs) : null,
          })),
        },
      },
      include: { questions: true },
    });
    return res.status(201).json(quiz);
  })
);

quizzesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const isTeacher = req.user!.role === "teacher";
    let attemptCount = 0;
    if (!isTeacher) {
      attemptCount = await prisma.quizAttempt.count({ where: { quizId: quiz.id, studentId: req.user!.userId } });
    }

    return res.json({
      id: quiz.id,
      title: quiz.title,
      timerMinutes: quiz.timerMinutes,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      shuffle: quiz.shuffle,
      attemptsUsed: attemptCount,
      canAttempt: isTeacher || attemptCount < quiz.maxAttempts,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: parseJson(q.options, null),
        matchingPairs: parseJson(q.matchingPairs, null),
        imageUrl: q.imageUrl,
        points: q.points,
        ...(isTeacher ? { correctAnswer: parseJson(q.correctAnswer, null) } : {}),
      })),
    });
  })
);

quizzesRouter.post(
  "/:id/attempts",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const existingCount = await prisma.quizAttempt.count({
      where: { quizId: quiz.id, studentId: req.user!.userId },
    });
    if (existingCount >= quiz.maxAttempts) {
      return res.status(400).json({ error: "Maximum attempts reached" });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentId: req.user!.userId,
        attemptNumber: existingCount + 1,
        status: "in_progress",
      },
    });
    return res.status(201).json(attempt);
  })
);

export const attemptsRouter = Router();

attemptsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: req.params.id },
      include: { responses: true },
    });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    return res.json({
      id: attempt.id,
      quizId: attempt.quizId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      maxScore: attempt.maxScore,
      responses: attempt.responses.map((r) => ({
        questionId: r.questionId,
        response: parseJson(r.response, null),
      })),
    });
  })
);

attemptsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { questionId, response } = req.body;
    const saved = await prisma.quizResponse.upsert({
      where: { attemptId_questionId: { attemptId: req.params.id, questionId } },
      update: { response: JSON.stringify(response) },
      create: { attemptId: req.params.id, questionId, response: JSON.stringify(response) },
    });
    return res.json(saved);
  })
);

attemptsRouter.post(
  "/:id/submit",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: req.params.id },
      include: { responses: true, quiz: { include: { questions: true, course: true } } },
    });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    let score = 0;
    let maxScore = 0;
    for (const question of attempt.quiz.questions) {
      maxScore += question.points;
      const existingResponse = attempt.responses.find((r) => r.questionId === question.id);
      const responseValue = parseJson(existingResponse?.response, null);
      const correctAnswer = parseJson(question.correctAnswer, null);
      const grade = gradeResponse(question.type, responseValue, correctAnswer, question.points);

      if (existingResponse) {
        await prisma.quizResponse.update({
          where: { id: existingResponse.id },
          data: {
            isCorrect: grade.isCorrect,
            pointsAwarded: grade.pointsAwarded,
            needsManualReview: grade.needsManualReview,
          },
        });
      } else {
        await prisma.quizResponse.create({
          data: {
            attemptId: attempt.id,
            questionId: question.id,
            response: null,
            isCorrect: grade.needsManualReview ? null : false,
            pointsAwarded: grade.needsManualReview ? null : 0,
            needsManualReview: grade.needsManualReview,
          },
        });
      }
      if (grade.pointsAwarded) score += grade.pointsAwarded;
    }

    const hasManualReview = attempt.quiz.questions.some((q) => q.type === "essay");
    await awardXp(attempt.studentId, "complete_quiz", attempt.quizId, XP_RULES.complete_quiz);
    if (maxScore > 0 && score === maxScore) {
      await awardXp(attempt.studentId, "perfect_quiz", attempt.quizId, XP_RULES.perfect_quiz);
    }
    if (maxScore > 0) {
      const percent = (score / maxScore) * 100;
      await checkAndTriggerIntervention({
        studentId: attempt.studentId,
        teacherId: attempt.quiz.course.teacherId,
        subject: attempt.quiz.course.subject,
        competency: attempt.quiz.title,
        percent,
      });
    }
    const updated = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        score,
        maxScore,
        status: hasManualReview ? "pending_review" : "graded",
      },
    });
    return res.json(updated);
  })
);

attemptsRouter.get(
  "/:id/review",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        quiz: { include: { questions: { orderBy: { orderIndex: "asc" } } } },
        responses: true,
      },
    });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    return res.json({
      id: attempt.id,
      score: attempt.score,
      maxScore: attempt.maxScore,
      passed: attempt.score !== null && attempt.maxScore ? (attempt.score / attempt.maxScore) * 100 >= attempt.quiz.passingScore : null,
      status: attempt.status,
      questions: attempt.quiz.questions.map((q) => {
        const r = attempt.responses.find((resp) => resp.questionId === q.id);
        return {
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          correctAnswer: parseJson(q.correctAnswer, null),
          response: parseJson(r?.response, null),
          isCorrect: r?.isCorrect ?? null,
          pointsAwarded: r?.pointsAwarded ?? null,
          needsManualReview: r?.needsManualReview ?? false,
        };
      }),
    });
  })
);
