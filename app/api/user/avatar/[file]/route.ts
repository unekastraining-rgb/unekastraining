import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { uploadsDir } from "@/lib/data-dir";
import { getOrCreateDefaultUser } from "@/lib/user";

const AVATAR_DIR = uploadsDir("avatars");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const user = await getOrCreateDefaultUser();

  if (!file.startsWith(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = path.join(AVATAR_DIR, file);
  const buffer = await readFile(filePath);
  const ext = path.extname(file).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
