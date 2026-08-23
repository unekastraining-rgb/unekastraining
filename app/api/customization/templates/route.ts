import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { saveCustomizationFile } from "@/lib/customization/storage";
import { getOrCreateDefaultUser } from "@/lib/user";
import type { MediaAssetKind } from "@/lib/customization/types";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

export async function GET(request: Request) {
  const user = await getOrCreateDefaultUser();
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");

  const assets = await db.userMediaAsset.findMany({
    where: {
      userId: user.id,
      ...(kind ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      kind: asset.kind,
      mimeType: asset.mimeType,
      category: asset.category,
      metadataJson: JSON.parse(asset.metadataJson || "{}"),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const user = await getOrCreateDefaultUser();
  const form = await request.formData();
  const file = form.get("file");
  const name = String(form.get("name") ?? "Imported template");
  const kind = (String(form.get("kind") ?? "template") as MediaAssetKind) || "template";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, or PDF." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { assetId, filePath } = await saveCustomizationFile(buffer, file.name);

  const asset = await db.userMediaAsset.create({
    data: {
      id: assetId,
      userId: user.id,
      name: name.trim() || file.name,
      kind,
      mimeType: file.type,
      filePath,
      category: "imported",
      metadataJson: JSON.stringify({ originalName: file.name }),
    },
  });

  return NextResponse.json({
    id: asset.id,
    name: asset.name,
    kind: asset.kind,
    mimeType: asset.mimeType,
    category: asset.category,
    createdAt: asset.createdAt.toISOString(),
  });
}
