import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

export const coursesRouter = Router();

coursesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;

    if (role === "student") {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        include: {
          course: {
            include: {
              teacher: true,
              modules: { include: { lessons: true } },
            },
          },
        },
      });
      return res.json(
        enrollments.map((e) => {
          const totalLessons = e.course.modules.flatMap((m) => m.lessons).length;
          return {
            id: e.course.id,
            title: e.course.title,
            subject: e.course.subject,
            teacherName: `${e.course.teacher.firstName} ${e.course.teacher.lastName}`,
            progressPercent: e.progressPercent,
            lessonCount: totalLessons,
            moduleCount: e.course.modules.length,
          };
        })
      );
    }

    const courses = await prisma.course.findMany({
      where: { teacherId: userId },
      include: { enrollments: true, modules: { include: { lessons: true } } },
    });
    return res.json(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        studentCount: c.enrollments.length,
        lessonCount: c.modules.flatMap((m) => m.lessons).length,
        moduleCount: c.modules.length,
      }))
    );
  })
);

coursesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        modules: {
          orderBy: { orderIndex: "asc" },
          include: { lessons: { orderBy: { orderIndex: "asc" } } },
        },
      },
    });
    if (!course) return res.status(404).json({ error: "Course not found" });

    let progressByLesson = new Map<string, string>();
    if (req.user!.role === "student") {
      const progress = await prisma.lessonProgress.findMany({ where: { studentId: req.user!.userId } });
      progressByLesson = new Map(progress.map((p) => [p.lessonId, p.status]));
    }

    return res.json({
      id: course.id,
      title: course.title,
      subject: course.subject,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          status: l.status,
          progressStatus: progressByLesson.get(l.id) ?? "locked",
        })),
      })),
    });
  })
);

coursesRouter.post(
  "/:id/modules",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const module = await prisma.module.create({
      data: {
        courseId: req.params.id,
        title: req.body.title,
        orderIndex: req.body.orderIndex ?? 0,
        status: "draft",
      },
    });
    return res.status(201).json(module);
  })
);

