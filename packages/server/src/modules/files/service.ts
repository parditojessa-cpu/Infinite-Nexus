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
