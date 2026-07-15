import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma.js";
import { UPLOADS_ROOT } from "../../storage/StorageService.js";

export async function createFileAssetFromUpload(
  file: Express.Multer.File,
  category: string,
  ownerId: string
) {
  const storagePath = path.relative(UPLOADS_ROOT, file.path).split(path.sep).join("/");
  return prisma.fileAsset.create({
    data: {
      ownerId,
      category,
      originalName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
    },
  });
}

// For server-generated files (e.g. AI-generated PDFs) that were written
// directly to disk rather than received via a multer upload.
export async function createFileAssetFromDisk(
  absolutePath: string,
  originalName: string,
  mimeType: string,
  ownerId: string,
  category: string
) {
  const storagePath = path.relative(UPLOADS_ROOT, absolutePath).split(path.sep).join("/");
  const { size } = fs.statSync(absolutePath);
  return prisma.fileAsset.create({
    data: { ownerId, category, originalName, storagePath, mimeType, size },
  });
}
