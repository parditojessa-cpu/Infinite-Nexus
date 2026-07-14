import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { DEFAULT_PASSING_THRESHOLD } from "@finite-nexus/shared";

export const gradebookRouter = Router();

function remarkFor(percent: number, threshold: number) {
  return percent >= threshold ? "Passed" : "Failed";
}

async function buildStudentRows(studentId: string, courseId?: string) {
  const entries = await prisma.gradebookEntry.findMany({
    where: { studentId, ...(courseId ? { courseId } : {}) },
    include: { course: true },
    orderBy: { createdAt: "asc" },
  });
  return entries.map((e) => ({
    id: e.id,
    course: e.course.title,
    category: e.category,
    score: e.score,
    maxScore: e.maxScore,
    percent: Math.round((e.score / e.maxScore) * 1000) / 10,
    quarter: e.quarter,
    remarks: remarkFor((e.score / e.maxScore) * 100, DEFAULT_PASSING_THRESHOLD),
  }));
}

gradebookRouter.get(
  "/me",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await buildStudentRows(req.user!.userId);
    const average = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;
    const highest = rows.length ? Math.max(...rows.map((r) => r.percent)) : 0;
    const lowest = rows.length ? Math.min(...rows.map((r) => r.percent)) : 0;
    const completionRate = rows.length ? 100 : 0;

    const bySubject = new Map<string, number[]>();
    for (const r of rows) {
      const arr = bySubject.get(r.course) ?? [];
      arr.push(r.percent);
      bySubject.set(r.course, arr);
    }

    return res.json({
      summary: {
        average: Math.round(average * 10) / 10,
        highest,
        lowest,
        completionRate,
      },
      chartBySubject: Array.from(bySubject.entries()).map(([subject, percents]) => ({
        subject,
        average: Math.round((percents.reduce((s, p) => s + p, 0) / percents.length) * 10) / 10,
      })),
      rows,
    });
  })
);

gradebookRouter.get(
  "/course/:courseId",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: req.params.courseId },
      include: { student: true },
    });
    const results = [];
    for (const e of enrollments) {
      const rows = await buildStudentRows(e.studentId, req.params.courseId);
      const average = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;
      results.push({
        studentId: e.studentId,
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        finalGrade: Math.round(average * 10) / 10,
        remarks: remarkFor(average, DEFAULT_PASSING_THRESHOLD),
        rows,
      });
    }
    return res.json(results);
  })
);

gradebookRouter.get(
  "/export/pdf",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const courseId = req.query.courseId as string;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, include: { student: true } });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="gradebook-${courseId}.pdf"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text(`Gradebook — ${course?.title ?? ""}`, { align: "left" });
    doc.moveDown();
    doc.fontSize(11);
    for (const e of enrollments) {
      const rows = await buildStudentRows(e.studentId, courseId);
      const average = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;
      doc
        .fontSize(13)
        .text(`${e.student.firstName} ${e.student.lastName} — Final: ${average.toFixed(1)}% (${remarkFor(average, DEFAULT_PASSING_THRESHOLD)})`);
      doc.fontSize(10);
      for (const r of rows) {
        doc.text(`  ${r.category} — ${r.score}/${r.maxScore} (${r.percent}%) — ${r.remarks}`);
      }
      doc.moveDown(0.5);
    }
    doc.end();
  })
);

gradebookRouter.get(
  "/export/excel",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const courseId = req.query.courseId as string;
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, include: { student: true } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Gradebook");
    sheet.columns = [
      { header: "Student", key: "student", width: 24 },
      { header: "Category", key: "category", width: 16 },
      { header: "Score", key: "score", width: 10 },
      { header: "Max", key: "max", width: 10 },
      { header: "Percent", key: "percent", width: 10 },
      { header: "Quarter", key: "quarter", width: 10 },
      { header: "Remarks", key: "remarks", width: 10 },
    ];

    for (const e of enrollments) {
      const rows = await buildStudentRows(e.studentId, courseId);
      for (const r of rows) {
        sheet.addRow({
          student: `${e.student.firstName} ${e.student.lastName}`,
          category: r.category,
          score: r.score,
          max: r.maxScore,
          percent: r.percent,
          quarter: r.quarter,
          remarks: r.remarks,
        });
      }
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="gradebook-${courseId}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  })
);
