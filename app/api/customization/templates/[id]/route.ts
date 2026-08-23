import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCustomizationFilePath } from "@/lib/customization/storage";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getOrCreateDefaultUser();

  const asset = await db.userMediaAsset.findFirst({
    where: { id, userId: user.id },
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = getCustomizationFilePath(asset.id);
  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getOrCreateDefaultUser();

  const asset = await db.userMediaAsset.findFirst({
    where: { id, userId: user.id },
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.userMediaAsset.delete({ where: { id: asset.id } });
  return NextResponse.json({ ok: true });
}
