import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { uploadsDir } from "@/lib/data-dir";

const UPLOAD_DIR = uploadsDir("customization");

export async function saveCustomizationFile(
  buffer: Buffer,
  fileName: string,
): Promise<{ assetId: string; filePath: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const assetId = `${randomUUID()}-${safeName}`;
  const filePath = path.join(UPLOAD_DIR, assetId);
  await writeFile(filePath, buffer);
  return { assetId, filePath };
}

export function getCustomizationFilePath(assetId: string): string {
  return path.join(UPLOAD_DIR, assetId);
}
