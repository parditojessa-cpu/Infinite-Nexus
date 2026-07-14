import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import { absolutePathFor } from "../../storage/StorageService.js";

export const filesRouter = Router();

filesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = await prisma.fileAsset.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: "File not found" });
    return res.download(absolutePathFor(file.storagePath), file.originalName);
  })
);
