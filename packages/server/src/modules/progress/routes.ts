import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

export const progressRouter = Router();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function avgPercent(entries: { score: number; maxScore: number }[]): number {
  if (entries.length === 0) return 0;
  return Math.round((entries.reduce((s, e) => s + (e.score / e.maxScore) * 100, 0) / entries.length) * 10) / 10;
}

progressRouter.get(
  "/me",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.userId;

    const [gradebook, attendance, quizAttempts, assignments, enrollments, interventionProfile] = await Promise.all([
      prisma.gradebookEntry.findMany({ where: { studentId }, orderBy: { createdAt: "asc" } }),
      prisma.attendanceRecord.findMany({ where: { studentId }, orderBy: { date: "asc" } }),
      prisma.quizAttempt.findMany({ where: { studentId, submittedAt: { not: null } }, orderBy: { submittedAt: "asc" } }),
      prisma.assignmentSubmission.findMany({ where: { studentId } }),
      prisma.enrollment.findMany({ where: { studentId } }),
      prisma.interventionProfile.findUnique({ where: { studentId } }),
    ]);

    function periodAverage(since: Date, until: Date) {
      const rows = gradebook.filter((g) => g.createdAt >= since && g.createdAt < until);
      return avgPercent(rows);
    }

    const now = new Date();
    const weekly = periodAverage(daysAgo(7), now) - periodAverage(daysAgo(14), daysAgo(7));
    const monthly = periodAverage(daysAgo(30), now) - periodAverage(daysAgo(60), daysAgo(30));
    const yearly = periodAverage(daysAgo(365), now) - periodAverage(daysAgo(730), daysAgo(365));

    const gradesTrend = gradebook.map((g) => ({
      label: g.createdAt.toLocaleDateString(),
      value: Math.round((g.score / g.maxScore) * 1000) / 10,
    }));

    const attendanceByWeek = new Map<string, { present: number; total: number }>();
    for (const a of attendance) {
      const weekLabel = a.date.toLocaleDateString();
      const bucket = attendanceByWeek.get(weekLabel) ?? { present: 0, total: 0 };
      bucket.total += 1;
      if (a.status === "present" || a.status === "late") bucket.present += 1;
      attendanceByWeek.set(weekLabel, bucket);
    }
    const attendanceTrend = Array.from(attendanceByWeek.entries()).map(([label, v]) => ({
      label,
      value: Math.round((100 * v.present) / v.total),
    }));

    const quizPerformance = quizAttempts.map((a) => ({
      label: a.submittedAt?.toLocaleDateString() ?? "",
      value: a.maxScore ? Math.round(((a.score ?? 0) / a.maxScore) * 1000) / 10 : 0,
    }));

    const assignmentCompletion = [
      { label: "Submitted", value: assignments.filter((a) => a.status !== "not_submitted").length },
      { label: "Not Submitted", value: assignments.filter((a) => a.status === "not_submitted").length },
    ];

    const attendanceRate = attendance.length
      ? Math.round((100 * attendance.filter((a) => a.status === "present" || a.status === "late").length) / attendance.length)
      : 100;

    const competencyMastery = {
      Quizzes: avgPercent(gradebook.filter((g) => g.category === "quiz")),
      Assignments: avgPercent(gradebook.filter((g) => g.category === "assignment")),
      Exams: avgPercent(gradebook.filter((g) => g.category === "exam")),
      Attendance: attendanceRate,
      Participation: avgPercent(gradebook.filter((g) => g.category === "participation")),
    };

    const learningProgress = enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / enrollments.length)
      : 0;

    return res.json({
      improvement: {
        weekly: Math.round(weekly * 10) / 10,
        monthly: Math.round(monthly * 10) / 10,
        yearly: Math.round(yearly * 10) / 10,
      },
      charts: { gradesTrend, attendanceTrend, quizPerformance, assignmentCompletion },
      competencyMastery,
      learningProgress,
      interventionStatus: interventionProfile?.interventionStatus ?? "no_intervention_required",
    });
  })
);
