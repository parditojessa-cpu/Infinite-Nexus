import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { uploadFor } from "../../middleware/upload.js";
import { createFileAssetFromUpload } from "../files/service.js";
import { awardXp } from "../../lib/xpEngine.js";
import { checkAndTriggerIntervention } from "../../lib/interventionEngine.js";
import { XP_RULES } from "@finite-nexus/shared";

export const assignmentsRouter = Router();
const submissionUpload = uploadFor("assignment-submissions");
const rubricUpload = uploadFor("assignment-rubrics");

assignmentsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId, role } = req.user!;
    const { courseId } = req.query as { courseId?: string };

    if (role === "student") {
      const enrollments = await prisma.enrollment.findMany({ where: { studentId: userId } });
      const courseIds = courseId ? [courseId] : enrollments.map((e) => e.courseId);
      const assignments = await prisma.assignment.findMany({
        where: { courseId: { in: courseIds } },
        include: { course: true, submissions: { where: { studentId: userId } } },
        orderBy: { dueDate: "asc" },
      });
      return res.json(
        assignments.map((a) => {
          const sub = a.submissions[0];
          return {
            id: a.id,
            title: a.title,
            courseName: a.course.title,
            dueDate: a.dueDate,
            pointsPossible: a.pointsPossible,
            status: sub?.status ?? "not_submitted",
            score: sub?.score ?? null,
            feedback: sub?.feedback ?? null,
            hasRubric: !!a.rubricFileAssetId,
          };
        })
      );
    }

    const courses = await prisma.course.findMany({ where: { teacherId: userId } });
    const courseIds = courseId ? [courseId] : courses.map((c) => c.id);
    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: { course: true, submissions: true },
      orderBy: { dueDate: "asc" },
    });
    return res.json(
      assignments.map((a) => ({
        id: a.id,
        title: a.title,
        courseName: a.course.title,
        dueDate: a.dueDate,
        pointsPossible: a.pointsPossible,
        submissionCount: a.submissions.filter((s) => s.status !== "not_submitted").length,
        gradedCount: a.submissions.filter((s) => s.status === "graded").length,
      }))
    );
  })
);

assignmentsRouter.post(
  "/",
  requireAuth,
  requireRole("teacher"),
  rubricUpload.single("rubric"),
  asyncHandler(async (req: AuthedRequest, res) => {
    let rubricFileAssetId: string | undefined;
    if (req.file) {
      const asset = await createFileAssetFromUpload(req.file, "assignment-rubrics", req.user!.userId);
      rubricFileAssetId = asset.id;
    }
    const assignment = await prisma.assignment.create({
      data: {
        courseId: req.body.courseId,
        title: req.body.title,
        instructions: req.body.instructions,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        pointsPossible: req.body.pointsPossible ? Number(req.body.pointsPossible) : 100,
        rubricFileAssetId,
      },
    });
    return res.status(201).json(assignment);
  })
);

assignmentsRouter.get(
  "/:id/submissions",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: req.params.id },
      include: { student: true, fileAsset: true },
    });
    return res.json(
      submissions.map((s) => ({
        id: s.id,
        studentName: `${s.student.firstName} ${s.student.lastName}`,
        submittedAt: s.submittedAt,
        status: s.status,
        score: s.score,
        feedback: s.feedback,
        fileId: s.fileAssetId,
        fileName: s.fileAsset?.originalName,
        note: s.note,
      }))
    );
  })
);

assignmentsRouter.post(
  "/:id/submissions",
  requireAuth,
  requireRole("student"),
  submissionUpload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    let fileAssetId: string | undefined;
    if (req.file) {
      const asset = await createFileAssetFromUpload(req.file, "assignment-submissions", req.user!.userId);
      fileAssetId = asset.id;
    }
    const before = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId: req.params.id, studentId: req.user!.userId } },
    });
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: req.params.id, studentId: req.user!.userId } },
      update: { submittedAt: new Date(), fileAssetId, note: req.body.note, status: "submitted" },
      create: {
        assignmentId: req.params.id,
        studentId: req.user!.userId,
        submittedAt: new Date(),
        fileAssetId,
        note: req.body.note,
        status: "submitted",
      },
    });
    if (!before || before.status === "not_submitted") {
      await awardXp(req.user!.userId, "complete_assignment", req.params.id, XP_RULES.complete_assignment);
    }
    return res.status(201).json(submission);
  })
);

assignmentsRouter.patch(
  "/submissions/:submissionId/grade",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const submission = await prisma.assignmentSubmission.update({
      where: { id: req.params.submissionId },
      data: {
        score: Number(req.body.score),
        feedback: req.body.feedback,
        status: "graded",
        gradedById: req.user!.userId,
        gradedAt: new Date(),
      },
      include: { assignment: { include: { course: true } } },
    });
    if (submission.score !== null && submission.assignment.pointsPossible > 0) {
      const percent = (submission.score / submission.assignment.pointsPossible) * 100;
      await checkAndTriggerIntervention({
        studentId: submission.studentId,
        teacherId: submission.assignment.course.teacherId,
        subject: submission.assignment.course.subject,
        competency: submission.assignment.title,
        percent,
      });
    }
    return res.json(submission);
  })
);
