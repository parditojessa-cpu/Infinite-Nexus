import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { uploadFor } from "../../middleware/upload.js";
import { createFileAssetFromUpload } from "../files/service.js";
import { awardXp } from "../../lib/xpEngine.js";
import { XP_RULES } from "@finite-nexus/shared";

export const modulesRouter = Router();
export const lessonsRouter = Router();

const lessonUpload = uploadFor("lesson-resources");

modulesRouter.post(
  "/:moduleId/lessons",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: req.params.moduleId,
        title: req.body.title,
        orderIndex: req.body.orderIndex ?? 0,
        status: "draft",
      },
    });
    return res.status(201).json(lesson);
  })
);

modulesRouter.patch(
  "/:moduleId",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const module = await prisma.module.update({
      where: { id: req.params.moduleId },
      data: { status: req.body.status, title: req.body.title },
    });
    return res.json(module);
  })
);

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

lessonsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        resources: { include: { fileAsset: true } },
        module: { include: { course: true, lessons: { orderBy: { orderIndex: "asc" } } } },
      },
    });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    let progress = null;
    if (req.user!.role === "student") {
      progress = await prisma.lessonProgress.findUnique({
        where: { lessonId_studentId: { lessonId: lesson.id, studentId: req.user!.userId } },
      });
    }

    return res.json({
      id: lesson.id,
      title: lesson.title,
      status: lesson.status,
      learningCompetency: lesson.learningCompetency,
      objectives: parseJson<string[]>(lesson.objectives, []),
      videoUrl: lesson.videoUrl,
      examples: parseJson<string[]>(lesson.examples, []),
      lessonNotes: lesson.lessonNotes,
      assessment: lesson.assessment,
      reflectionPrompt: lesson.reflectionPrompt,
      references: parseJson<string[]>(lesson.references, []),
      resources: lesson.resources.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        fileId: r.fileAssetId,
        fileName: r.fileAsset?.originalName,
      })),
      siblingLessons: lesson.module.lessons.map((l) => ({ id: l.id, title: l.title })),
      courseId: lesson.module.courseId,
      moduleTitle: lesson.module.title,
      progress: progress
        ? { status: progress.status, bookmarked: progress.bookmarked, studentNotes: progress.studentNotes }
        : { status: "active", bookmarked: false, studentNotes: "" },
    });
  })
);

lessonsRouter.patch(
  "/:id/progress",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const before = await prisma.lessonProgress.findUnique({
      where: { lessonId_studentId: { lessonId: req.params.id, studentId: req.user!.userId } },
    });
    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId: req.params.id, studentId: req.user!.userId } },
      update: { status: req.body.status, completedAt: req.body.status === "done" ? new Date() : null },
      create: {
        lessonId: req.params.id,
        studentId: req.user!.userId,
        status: req.body.status,
        completedAt: req.body.status === "done" ? new Date() : null,
      },
    });
    if (req.body.status === "done" && before?.status !== "done") {
      await awardXp(req.user!.userId, "complete_lesson", req.params.id, XP_RULES.complete_lesson);
    }
    return res.json(progress);
  })
);

lessonsRouter.post(
  "/:id/bookmark",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.lessonProgress.findUnique({
      where: { lessonId_studentId: { lessonId: req.params.id, studentId: req.user!.userId } },
    });
    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId: req.params.id, studentId: req.user!.userId } },
      update: { bookmarked: !existing?.bookmarked },
      create: { lessonId: req.params.id, studentId: req.user!.userId, bookmarked: true },
    });
    return res.json(progress);
  })
);

lessonsRouter.put(
  "/:id/notes",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId: req.params.id, studentId: req.user!.userId } },
      update: { studentNotes: req.body.notes },
      create: { lessonId: req.params.id, studentId: req.user!.userId, studentNotes: req.body.notes },
    });
    return res.json(progress);
  })
);

lessonsRouter.get(
  "/:id/resources",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const resources = await prisma.lessonResource.findMany({
      where: { lessonId: req.params.id },
      include: { fileAsset: true },
    });
    return res.json(resources);
  })
);

lessonsRouter.post(
  "/:id/resources",
  requireAuth,
  requireRole("teacher"),
  lessonUpload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "File is required" });
    const fileAsset = await createFileAssetFromUpload(req.file, "lesson-resources", req.user!.userId);
    const resource = await prisma.lessonResource.create({
      data: {
        lessonId: req.params.id,
        type: req.body.type,
        title: req.body.title ?? req.file.originalname,
        fileAssetId: fileAsset.id,
        uploadedById: req.user!.userId,
      },
    });
    return res.status(201).json(resource);
  })
);
