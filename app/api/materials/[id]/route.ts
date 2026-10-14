import { unlink } from "fs/promises";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const material = await db.courseMaterial.findFirst({
      where: { id, course: { userId: user.id } },
      select: { id: true, filePath: true },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }

    await db.courseMaterial.delete({ where: { id: material.id } });

    if (material.filePath) {
      try {
        await unlink(material.filePath);
      } catch {
        // File may already be gone — DB row is the source of truth.
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete material:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete material." },
      { status: 500 },
    );
  }
}
