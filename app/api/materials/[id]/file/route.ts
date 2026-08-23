import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await params;

    const material = await db.courseMaterial.findFirst({
      where: { id, course: { userId: user.id } },
    });

    if (!material?.filePath) {
      return NextResponse.json({ error: "Material file not found." }, { status: 404 });
    }

    const buffer = await readFile(material.filePath);
    const ext = path.extname(material.filePath).toLowerCase();
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Failed to serve material file:", error);
    return NextResponse.json({ error: "Failed to load file." }, { status: 500 });
  }
}
