import { NextResponse } from "next/server";

import {
  getOrCreateMaterialWorkbook,
  loadMaterialForUser,
  previewTextForMaterial,
} from "@/lib/materials/workbook-from-material";
import { coreCourseHref } from "@/lib/study/client-launch";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const material = await loadMaterialForUser(user.id, id);

    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        title: material.title,
        type: material.type,
        courseId: material.courseId,
        courseTitle: material.course.title,
        url: material.url,
        hasFile: Boolean(material.filePath),
        previewText: previewTextForMaterial(material.extractedText, material.title),
      },
    });
  } catch (error) {
    console.error("Failed to load material preview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load material." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { mode?: string };
    const mode = body.mode === "core" ? "core" : "preview";

    if (mode === "core") {
      const result = await getOrCreateMaterialWorkbook(user.id, id);
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Material not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        mode: "core",
        created: result.created,
        noteId: result.note.id,
        coreHref: coreCourseHref({
          courseId: result.material.courseId,
          noteId: result.note.id,
          materialId: result.material.id,
        }),
        material: {
          id: result.material.id,
          title: result.material.title,
          type: result.material.type,
          courseId: result.material.courseId,
          courseTitle: result.material.course.title,
          url: result.material.url,
          hasFile: Boolean(result.material.filePath),
          previewText: previewTextForMaterial(
            result.material.extractedText,
            result.material.title,
          ),
        },
      });
    }

    const material = await loadMaterialForUser(user.id, id);
    if (!material) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      mode: "preview",
      material: {
        id: material.id,
        title: material.title,
        type: material.type,
        courseId: material.courseId,
        courseTitle: material.course.title,
        url: material.url,
        hasFile: Boolean(material.filePath),
        previewText: previewTextForMaterial(material.extractedText, material.title),
      },
    });
  } catch (error) {
    console.error("Failed to open material:", error);
    return NextResponse.json(
      { success: false, error: "Failed to open material." },
      { status: 500 },
    );
  }
}
