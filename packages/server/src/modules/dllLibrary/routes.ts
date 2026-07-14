import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { uploadFor } from "../../middleware/upload.js";
import { createFileAssetFromUpload } from "../files/service.js";

export const dllLibraryRouter = Router();
const dllUpload = uploadFor("dll-library");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DLL_TEMPLATE_PATH = path.resolve(__dirname, "../../../assets/ilaw-dll-template.docx");

dllLibraryRouter.get(
  "/courses/:courseId",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const documents = await prisma.dllDocument.findMany({
      where: { courseId: req.params.courseId },
      include: { fileAsset: true, uploadedBy: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(
      documents.map((d) => ({
        id: d.id,
        title: d.title,
        program: d.program,
        gradeLevel: d.gradeLevel,
        learningArea: d.learningArea,
        quarter: d.quarter,
        teachingDates: d.teachingDates,
        fileId: d.fileAssetId,
        fileName: d.fileAsset.originalName,
        size: d.fileAsset.size,
        uploadedBy: `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}`,
        createdAt: d.createdAt,
      }))
    );
  })
);

dllLibraryRouter.get("/template", requireAuth, (_req, res) => {
  res.download(DLL_TEMPLATE_PATH, "ILAW-DLL-Template.docx");
});

dllLibraryRouter.post(
  "/courses/:courseId",
  requireAuth,
  requireRole("teacher"),
  dllUpload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "File is required" });
    const fileAsset = await createFileAssetFromUpload(req.file, "dll-library", req.user!.userId);
    const document = await prisma.dllDocument.create({
      data: {
        courseId: req.params.courseId,
        title: req.body.title || req.file.originalname,
        program: req.body.program || "ILAW",
        gradeLevel: req.body.gradeLevel || null,
        learningArea: req.body.learningArea || null,
        quarter: req.body.quarter || null,
        teachingDates: req.body.teachingDates || null,
        fileAssetId: fileAsset.id,
        uploadedById: req.user!.userId,
      },
    });
    return res.status(201).json(document);
  })
);

dllLibraryRouter.delete(
  "/:id",
  requireAuth,
  requireRole("teacher"),
  asyncHandler(async (req: AuthedRequest, res) => {
    await prisma.dllDocument.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  })
);
