import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { uploadsDir } from "@/lib/data-dir";
import { getOrCreateDefaultUser, UnauthorizedError } from "@/lib/user";

const AVATAR_DIR = uploadsDir("avatars");

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Use a PNG or JPG image" }, { status: 400 });
    }

    await mkdir(AVATAR_DIR, { recursive: true });
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${user.id}-${randomUUID()}.${ext}`;
    const filePath = path.join(AVATAR_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const avatarUrl = `/api/user/avatar/${fileName}`;

    await db.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Avatar upload failed:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
