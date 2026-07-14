import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";

export const attendanceRouter = Router();

attendanceRouter.get(
  "/me",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: req.user!.userId },
      include: { course: true },
      orderBy: { date: "desc" },
    });
    const rate = records.length
      ? Math.round((100 * records.filter((r) => r.status === "present" || r.status === "late").length) / records.length)
      : 100;
    return res.json({
      attendanceRate: rate,
      history: records.map((r) => ({
        id: r.id,
        date: r.date,
        subject: r.course.subject,
        status: r.status,
      })),
    });
  })
);

attendanceRouter.get(
  "/course/:courseId",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
    const dayStart = new Date(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: req.params.courseId },
      include: { student: true },
    });
    const records = await prisma.attendanceRecord.findMany({
      where: { courseId: req.params.courseId, date: { gte: dayStart, lt: dayEnd } },
    });
    const byStudent = new Map(records.map((r) => [r.studentId, r.status]));

    return res.json(
      enrollments.map((e) => ({
        studentId: e.studentId,
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        status: byStudent.get(e.studentId) ?? null,
      }))
    );
  })
);

attendanceRouter.put(
  "/course/:courseId",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { date, records } = req.body as { date: string; records: { studentId: string; status: string }[] };
    const day = new Date(date);

    for (const r of records) {
      await prisma.attendanceRecord.upsert({
        where: { studentId_courseId_date: { studentId: r.studentId, courseId: req.params.courseId, date: day } },
        update: { status: r.status, recordedById: req.user!.userId },
        create: {
          studentId: r.studentId,
          courseId: req.params.courseId,
          date: day,
          status: r.status,
          recordedById: req.user!.userId,
        },
      });
    }
    return res.status(204).send();
  })
);

attendanceRouter.get(
  "/report",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const courseId = req.query.courseId as string;
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, include: { student: true } });
    const results = [];
    for (const e of enrollments) {
      const records = await prisma.attendanceRecord.findMany({ where: { studentId: e.studentId, courseId } });
      const rate = records.length
        ? Math.round((100 * records.filter((r) => r.status === "present" || r.status === "late").length) / records.length)
        : 100;
      results.push({ studentName: `${e.student.firstName} ${e.student.lastName}`, attendanceRate: rate, totalDays: records.length });
    }
    return res.json(results);
  })
);
