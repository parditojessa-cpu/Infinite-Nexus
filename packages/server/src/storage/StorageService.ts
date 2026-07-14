import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v4 as uuid } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads");

export interface StoredFile {
  storagePath: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export function ensureCategoryDir(category: string): string {
  const dir = path.join(UPLOADS_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function buildStoragePath(category: string, originalName: string): string {
  const ext = path.extname(originalName);
  return path.join(category, `${uuid()}${ext}`);
}

export function absolutePathFor(storagePath: string): string {
  return path.join(UPLOADS_ROOT, storagePath);
}
