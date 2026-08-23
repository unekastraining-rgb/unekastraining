import { NextResponse } from "next/server";

import type { SketchStroke } from "@/lib/core/note-types";
import { parseInkPageJson, serializeInkPage } from "@/lib/materials/ink-storage";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/user";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const pageNumber = Math.max(1, Number(searchParams.get("page") ?? 1));

    const material = await db.courseMaterial.findFirst({
      where: { id, course: { userId: user.id } },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }

    const inkPage = await db.materialInkPage.findUnique({
      where: {
        userId_materialId_pageNumber: {
          userId: user.id,
          materialId: id,
          pageNumber,
        },
      },
    });

    const ink = parseInkPageJson(inkPage?.strokesJson);

    return NextResponse.json({
      success: true,
      data: {
        pageNumber,
        strokes: ink.strokes,
        viewport: ink.viewport,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to load ink annotations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load annotations." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const pageNumber = Math.max(1, Number(body.pageNumber ?? 1));
    const strokes = (body.strokes ?? []) as SketchStroke[];
    const viewport =
      body.viewport &&
      typeof body.viewport.width === "number" &&
      typeof body.viewport.height === "number"
        ? {
            width: body.viewport.width,
            height: body.viewport.height,
          }
        : undefined;

    const material = await db.courseMaterial.findFirst({
      where: { id, course: { userId: user.id } },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }

    const strokesJson = serializeInkPage({ strokes, viewport });

    const inkPage = await db.materialInkPage.upsert({
      where: {
        userId_materialId_pageNumber: {
          userId: user.id,
          materialId: id,
          pageNumber,
        },
      },
      create: {
        userId: user.id,
        materialId: id,
        pageNumber,
        strokesJson,
      },
      update: { strokesJson },
    });

    return NextResponse.json({ success: true, data: { id: inkPage.id, pageNumber } });
  } catch (error) {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to save ink annotations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save annotations." },
      { status: 500 },
    );
  }
}
