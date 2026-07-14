import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

export const discussionsRouter = Router();

discussionsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { courseId, lessonId } = req.query as { courseId?: string; lessonId?: string };
    const threads = await prisma.discussionThread.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        lessonId: lessonId ?? null,
      },
      include: {
        author: true,
        replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
        likes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      threads.map((t) => ({
        id: t.id,
        title: t.title,
        pinned: t.pinned,
        createdAt: t.createdAt,
        author: `${t.author.firstName} ${t.author.lastName}`,
        likeCount: t.likes.length,
        likedByMe: t.likes.some((l) => l.userId === req.user!.userId),
        replies: t.replies.map((r) => ({
          id: r.id,
          body: r.body,
          author: `${r.author.firstName} ${r.author.lastName}`,
          createdAt: r.createdAt,
        })),
      }))
    );
  })
);

discussionsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const thread = await prisma.discussionThread.create({
      data: {
        courseId: req.body.courseId,
        lessonId: req.body.lessonId ?? null,
        authorId: req.user!.userId,
        title: req.body.title,
      },
    });
    return res.status(201).json(thread);
  })
);

discussionsRouter.post(
  "/:id/replies",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const reply = await prisma.discussionReply.create({
      data: {
        threadId: req.params.id,
        authorId: req.user!.userId,
        body: req.body.body,
      },
    });
    return res.status(201).json(reply);
  })
);

discussionsRouter.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.discussionLike.findFirst({
      where: { threadId: req.params.id, userId: req.user!.userId },
    });
    if (existing) {
      await prisma.discussionLike.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }
    await prisma.discussionLike.create({ data: { threadId: req.params.id, userId: req.user!.userId } });
    return res.json({ liked: true });
  })
);
