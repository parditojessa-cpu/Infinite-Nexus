import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

export const announcementsRouter = Router();

announcementsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;
    let courseIds: string[] | undefined;
    if (role === "student") {
      const enrollments = await prisma.enrollment.findMany({ where: { studentId: userId } });
      courseIds = enrollments.map((e) => e.courseId);
    } else {
      const courses = await prisma.course.findMany({ where: { teacherId: userId } });
      courseIds = courses.map((c) => c.id);
    }

    const announcements = await prisma.announcement.findMany({
      where: { OR: [{ courseId: { in: courseIds } }, { courseId: null }] },
      include: { author: true, comments: { include: { author: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        author: `${a.author.firstName} ${a.author.lastName}`,
        createdAt: a.createdAt,
        commentCount: a.comments.length,
        comments: a.comments.map((c) => ({
          id: c.id,
          author: `${c.author.firstName} ${c.author.lastName}`,
          body: c.body,
          createdAt: c.createdAt,
        })),
      }))
    );
  })
);

announcementsRouter.post(
  "/",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const announcement = await prisma.announcement.create({
      data: {
        authorId: req.user!.userId,
        courseId: req.body.courseId ?? null,
        title: req.body.title,
        body: req.body.body,
      },
    });
    return res.status(201).json(announcement);
  })
);

announcementsRouter.post(
  "/:id/comments",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const comment = await prisma.announcementComment.create({
      data: {
        announcementId: req.params.id,
        authorId: req.user!.userId,
        body: req.body.body,
      },
    });
    return res.status(201).json(comment);
  })
);
