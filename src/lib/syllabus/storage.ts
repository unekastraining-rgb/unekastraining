import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "syllabi");

export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string,
): Promise<{ uploadId: string; filePath: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uploadId = `${randomUUID()}-${safeName}`;
  const filePath = path.join(UPLOAD_DIR, uploadId);

  await writeFile(filePath, buffer);

  return { uploadId, filePath };
}

export function getUploadFilePath(uploadId: string): string {
  return path.join(UPLOAD_DIR, uploadId);
}
