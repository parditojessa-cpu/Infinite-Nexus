import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { levelForXp, nextLevelForXp } from "@finite-nexus/shared";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;

    if (role === "student") {
      const [enrollments, interventionProfile, studentLevel, announcements, attendance] =
        await Promise.all([
          prisma.enrollment.findMany({
            where: { studentId: userId },
            include: { course: true },
          }),
          prisma.interventionProfile.findUnique({ where: { studentId: userId } }),
          prisma.studentLevel.findUnique({ where: { studentId: userId } }),
          prisma.announcement.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { author: true },
          }),
          prisma.attendanceRecord.findMany({ where: { studentId: userId } }),
        ]);

      const attendanceRate =
        attendance.length === 0
          ? 100
          : Math.round(
              (100 * attendance.filter((a) => a.status === "present" || a.status === "late").length) /
                attendance.length
            );

      const gradebook = await prisma.gradebookEntry.findMany({ where: { studentId: userId } });
      const currentAverage = gradebook.length
        ? Math.round(
            (gradebook.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / gradebook.length) * 10
          ) / 10
        : null;

      const xp = studentLevel?.currentXp ?? 0;
      const level = levelForXp(xp);
      const next = nextLevelForXp(xp);

      const studentProfile = await prisma.studentProfile.findUnique({ where: { userId } });
      const profileFields = [
        studentProfile?.lrn,
        studentProfile?.gradeLevel,
        studentProfile?.strand,
        studentProfile?.birthday,
        studentProfile?.address,
        studentProfile?.contactNumber,
        studentProfile?.parentName,
        studentProfile?.parentContact,
      ];
      const profileCompletion = Math.round(
        (100 * profileFields.filter(Boolean).length) / profileFields.length
      );

      return res.json({
        stats: {
          profileCompletion,
          attendanceRate,
          currentAverage,
          activeCourses: enrollments.length,
        },
        courses: enrollments.map((e) => ({
          id: e.course.id,
          title: e.course.title,
          subject: e.course.subject,
          progressPercent: e.progressPercent,
        })),
        gamification: {
          xp,
          level: level.level,
          levelName: level.name,
          xpToNext: next ? next.xpRequired - xp : 0,
        },
        interventionStatus: interventionProfile?.interventionStatus ?? "no_intervention_required",
        announcements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          author: `${a.author.firstName} ${a.author.lastName}`,
          createdAt: a.createdAt,
        })),
      });
    }

    // teacher
    const [coursesTaught, sectionsAdvised] = await Promise.all([
      prisma.course.findMany({ where: { teacherId: userId }, include: { enrollments: true } }),
      prisma.section.findMany({ where: { adviserId: userId } }),
    ]);
    const courseIds = coursesTaught.map((c) => c.id);
    const studentCount = new Set(
      coursesTaught.flatMap((c) => c.enrollments.map((e) => e.studentId))
    ).size;

    const [pendingSubmissions, gradebookRows] = await Promise.all([
      prisma.assignmentSubmission.count({
        where: { status: "submitted", assignment: { courseId: { in: courseIds } } },
      }),
      prisma.gradebookEntry.findMany({ where: { courseId: { in: courseIds } } }),
    ]);
    const avgClassGrade = gradebookRows.length
      ? Math.round(
          (gradebookRows.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
            gradebookRows.length) *
            10
        ) / 10
      : null;

    return res.json({
      stats: {
        students: studentCount,
        classesToday: coursesTaught.length,
        avgClassGrade,
        pendingToGrade: pendingSubmissions,
      },
      classes: coursesTaught.map((c) => ({ id: c.id, title: c.title, subject: c.subject })),
      sectionsAdvised: sectionsAdvised.map((s) => s.name),
    });
  })
);
