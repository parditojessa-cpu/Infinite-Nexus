import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { computeRiskTier } from "@finite-nexus/shared";

export const usersRouter = Router();

usersRouter.get(
  "/me/profile",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (role === "student") {
      const [studentProfile, gradebook, attendance, interventionProfile, activePlan] = await Promise.all([
        prisma.studentProfile.findUnique({ where: { userId }, include: { section: true } }),
        prisma.gradebookEntry.findMany({ where: { studentId: userId } }),
        prisma.attendanceRecord.findMany({ where: { studentId: userId } }),
        prisma.interventionProfile.findUnique({ where: { studentId: userId } }),
        prisma.interventionPlan.findFirst({
          where: { studentId: userId, status: "active" },
          include: { teacher: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const average = gradebook.length
        ? Math.round((gradebook.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / gradebook.length) * 10) / 10
        : null;
      const attendanceRate = attendance.length
        ? Math.round((100 * attendance.filter((a) => a.status === "present" || a.status === "late").length) / attendance.length)
        : 100;
      const missingActivities = gradebook.filter((g) => g.remarks === "missing").length;
      const failedCompetencies = gradebook.filter((g) => g.score / g.maxScore < 0.75).length;

      return res.json({
        user: { id: user.id, email: user.email, studentId: user.studentId, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl },
        studentProfile,
        interventionProfile: {
          riskTier: interventionProfile?.riskTier ?? computeRiskTier(average ?? 75, attendanceRate),
          interventionStatus: interventionProfile?.interventionStatus ?? "no_intervention_required",
          stats: { average, attendanceRate, missingActivities, failedCompetencies },
          activePlan: activePlan
            ? {
                status: activePlan.status,
                program: activePlan.subject,
                assignedTeacher: `${activePlan.teacher.firstName} ${activePlan.teacher.lastName}`,
                targetScore: activePlan.targetScore,
                expectedCompletion: activePlan.expectedCompletion,
              }
            : null,
        },
      });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId } });
    return res.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl },
      teacherProfile,
    });
  })
);

usersRouter.patch(
  "/me/profile",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;
    if (role === "student") {
      const updated = await prisma.studentProfile.update({
        where: { userId },
        data: req.body,
      });
      return res.json({ studentProfile: updated });
    }
    const updated = await prisma.teacherProfile.update({ where: { userId }, data: req.body });
    return res.json({ teacherProfile: updated });
  })
);
