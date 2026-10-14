import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

import { uploadsDir } from "@/lib/data-dir";

const AVATAR_DIR = uploadsDir("avatars");
const MAX_AVATAR_BYTES = 900_000; // ~512px PNG after crop stays well under this

export function avatarMimeFromName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function isStoredAvatarUrl(avatarUrl: string | null | undefined): boolean {
  if (!avatarUrl) return false;
  return (
    avatarUrl.startsWith("/api/user/avatar") ||
    avatarUrl.includes("/api/user/avatar/")
  );
}

/** Stable account-scoped URL so any device with the same login can load the photo. */
export function accountAvatarUrl(userId: string, version?: number | string): string {
  const v = version != null ? `?v=${encodeURIComponent(String(version))}` : "";
  return `/api/user/avatar/${encodeURIComponent(userId)}${v}`;
}

export async function persistAvatarFiles(
  userId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ fileName: string }> {
  await mkdir(AVATAR_DIR, { recursive: true });
  const ext =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const fileName = `${userId}.${ext}`;
  await writeFile(path.join(/* turbopackIgnore: true */ AVATAR_DIR, fileName), buffer);
  return { fileName };
}

export async function readAvatarFile(fileName: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(/* turbopackIgnore: true */ AVATAR_DIR, fileName));
  } catch {
    return null;
  }
}

export function decodeAvatarData(data: string | null | undefined): Buffer | null {
  if (!data?.trim()) return null;
  try {
    return Buffer.from(data, "base64");
  } catch {
    return null;
  }
}

export function encodeAvatarData(buffer: Buffer): string {
  if (buffer.byteLength > MAX_AVATAR_BYTES) {
    throw new Error("Profile photo is too large. Use a smaller crop.");
  }
  return buffer.toString("base64");
}

export { AVATAR_DIR, MAX_AVATAR_BYTES };
