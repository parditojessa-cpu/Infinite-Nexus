import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { CERTIFICATE_TYPE_LABELS } from "@finite-nexus/shared";

export const certificatesRouter = Router();

certificatesRouter.get(
  "/me",
  requireAuth,
  requireRole("student"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.userId;
    const [gradebook, attendance, enrollments, existing] = await Promise.all([
      prisma.gradebookEntry.findMany({ where: { studentId } }),
      prisma.attendanceRecord.findMany({ where: { studentId } }),
      prisma.enrollment.findMany({ where: { studentId } }),
      prisma.certificate.findMany({ where: { studentId } }),
    ]);

    const average = gradebook.length ? gradebook.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / gradebook.length : 0;
    const attendanceRate = attendance.length
      ? (100 * attendance.filter((a) => a.status === "present" || a.status === "late").length) / attendance.length
      : 0;
    const anyCourseComplete = enrollments.some((e) => e.progressPercent >= 100);

    const criteria: Record<string, boolean> = {
      completion: anyCourseComplete,
      excellence: average >= 95,
      honor: average >= 90,
      perfect_attendance: attendance.length > 0 && attendanceRate >= 100,
    };

    for (const [type, met] of Object.entries(criteria)) {
      if (met && !existing.some((c) => c.type === type)) {
        await prisma.certificate.create({ data: { studentId, type, criteriaMet: JSON.stringify({ average, attendanceRate }) } });
      }
    }

    const certificates = await prisma.certificate.findMany({ where: { studentId } });
    return res.json(
      Object.keys(CERTIFICATE_TYPE_LABELS).map((type) => {
        const cert = certificates.find((c) => c.type === type);
        return {
          type,
          label: CERTIFICATE_TYPE_LABELS[type],
          earned: !!cert,
          certificateId: cert?.id ?? null,
          earnedAt: cert?.earnedAt ?? null,
        };
      })
    );
  })
);

certificatesRouter.get(
  "/:id/download",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id }, include: { student: true } });
    if (!cert) return res.status(404).json({ error: "Certificate not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${cert.type}.pdf"`);

    const doc = new PDFDocument({ layout: "landscape", margin: 60 });
    doc.pipe(res);

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke("#0f4c81");
    doc.moveDown(4);
    doc.fontSize(28).fillColor("#0f4c81").text("Certificate of " + (CERTIFICATE_TYPE_LABELS[cert.type] ?? cert.type), { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).fillColor("#1a2430").text("This certifies that", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(24).text(`${cert.student.firstName} ${cert.student.lastName}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text("has successfully met the criteria for this recognition at Finite Nexus.", { align: "center" });
    doc.moveDown(3);
    doc.fontSize(11).text(`Date Issued: ${cert.earnedAt.toLocaleDateString()}`, { align: "center" });
    doc.moveDown(3);

    const y = doc.y;
    doc.fontSize(10);
    doc.text("____________________", 100, y);
    doc.text("Adviser", 100, y + 15);
    doc.text("____________________", doc.page.width / 2 - 80, y);
    doc.text("Date Issued", doc.page.width / 2 - 80, y + 15);
    doc.text("____________________", doc.page.width - 260, y);
    doc.text("Principal", doc.page.width - 260, y + 15);

    doc.end();
  })
);
