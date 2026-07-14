import multer from "multer";
import path from "node:path";
import { ensureCategoryDir } from "../storage/StorageService.js";
import { v4 as uuid } from "uuid";

export function uploadFor(category: string) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, ensureCategoryDir(category));
    },
    filename: (_req, file, cb) => {
      cb(null, `${uuid()}${path.extname(file.originalname)}`);
    },
  });
  return multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
}
