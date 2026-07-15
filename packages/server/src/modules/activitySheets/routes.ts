import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import PDFDocument from "pdfkit";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { generateActivityQuestions } from "../../lib/aiClient.js";
import { ensureCategoryDir } from "../../storage/StorageService.js";
import { createFileAssetFromDisk } from "../files/service.js";

export const activitySheetsRouter = Router();

const generateSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  gradeLevel: z.string().optional(),
  learningArea: z.string().optional(),
  competency: z.string().optional(),
  numItems: z.coerce.number().int().min(1).max(30).default(10),
  difficulty: z.enum(["easy", "average", "challenging"]).default("average"),
});

activitySheetsRouter.get(
  "/courses/:courseId",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const sheets = await prisma.activitySheet.findMany({
      where: { courseId: req.params.courseId },
      include: { fileAsset: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(
      sheets.map((s) => ({
        id: s.id,
        title: s.title,
        topic: s.topic,
        gradeLevel: s.gradeLevel,
        learningArea: s.learningArea,
        competency: s.competency,
        numItems: s.numItems,
        difficulty: s.difficulty,
        fileId: s.fileAssetId,
        fileName: s.fileAsset.originalName,
        createdAt: s.createdAt,
      }))
    );
  })
);

activitySheetsRouter.post(
  "/courses/:courseId",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = generateSchema.parse(req.body);
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
    if (!course) return res.status(404).json({ error: "Class not found" });

    const generated = await generateActivityQuestions(input);

    const dir = ensureCategoryDir("activity-sheets");
    const filename = `${uuid()}.pdf`;
    const absPath = path.join(dir, filename);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(absPath);
      doc.pipe(stream);

      doc.fontSize(18).fillColor("#0f4c81").text(generated.title || input.title, { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#1a2430");
      doc.text(`Grade Level: ${input.gradeLevel ?? "—"}    Learning Area: ${input.learningArea ?? "—"}`);
      doc.text(`Competency: ${input.competency ?? "—"}    Difficulty: ${input.difficulty}`);
      doc.moveDown(1);
      if (generated.instructions) {
        doc.fontSize(11).text(generated.instructions);
        doc.moveDown(1);
      }

      doc.fontSize(12).fillColor("#000000");
      generated.questions.forEach((q, i) => {
        doc.text(`${i + 1}. ${q.prompt}`);
        doc.moveDown(1.5);
      });

      doc.addPage();
      doc.fontSize(16).fillColor("#0f4c81").text("Answer Key", { align: "center" });
      doc.moveDown(1);
      doc.fontSize(12).fillColor("#000000");
      generated.questions.forEach((q, i) => {
        doc.text(`${i + 1}. ${q.answer}`);
        doc.moveDown(0.5);
      });

      doc.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const fileAsset = await createFileAssetFromDisk(
      absPath,
      `${input.title}.pdf`,
      "application/pdf",
      req.user!.userId,
      "activity-sheets"
    );

    const sheet = await prisma.activitySheet.create({
      data: {
        courseId: course.id,
        teacherId: req.user!.userId,
        title: input.title,
        topic: input.topic,
        gradeLevel: input.gradeLevel,
        learningArea: input.learningArea,
        competency: input.competency,
        numItems: input.numItems,
        difficulty: input.difficulty,
        fileAssetId: fileAsset.id,
      },
    });

    return res.status(201).json({
      id: sheet.id,
      title: sheet.title,
      topic: sheet.topic,
      gradeLevel: sheet.gradeLevel,
      learningArea: sheet.learningArea,
      competency: sheet.competency,
      numItems: sheet.numItems,
      difficulty: sheet.difficulty,
      fileId: sheet.fileAssetId,
      fileName: fileAsset.originalName,
      createdAt: sheet.createdAt,
    });
  })
);

activitySheetsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.activitySheet.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);
