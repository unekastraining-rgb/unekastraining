import { unlink } from "fs/promises";

import { NextResponse } from "next/server";

import { MaterialType } from "@/generated/prisma";
import { db } from "@/lib/db";
import { inferMaterialType } from "@/lib/materials/types";
import { readableCourseTitle } from "@/lib/courses/display-name";
import { saveMaterialFile } from "@/lib/materials/storage";
import { extractTextFromFile, fileNeedsVisionOcr } from "@/lib/syllabus/extract-text";
import { isPptxFile } from "@/lib/syllabus/extract-pptx";
import {
  visionOcrFailureMessage,
  visionOcrUnusableReason,
} from "@/lib/syllabus/ocr-gate";
import { enrichCourseFromSyllabus, seedTopicsFromSyllabusOutline } from "@/lib/syllabus/enrich-course-from-syllabus";
import { getUserAppSettings } from "@/lib/settings/app-settings";
import { getOrCreateDefaultUser } from "@/lib/user";
import { getOrCreateDefaultTopic } from "@/lib/topics";
import { searchOwnedMaterials } from "@/lib/learning/material-ingestion";

const ALLOWED_TYPES = new Set<string>(Object.values(MaterialType));

function resolveType(raw: string | null | undefined, inferred: MaterialType): MaterialType {
  if (raw && ALLOWED_TYPES.has(raw)) return raw as MaterialType;
  return inferred;
}

/** List / search owned materials (learner-scoped). Never creates evidence. */
export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const courseId = url.searchParams.get("courseId")?.trim() ?? "";

    if (q.length >= 2) {
      const hits = await searchOwnedMaterials(user.id, q);
      return NextResponse.json({ success: true, materials: hits, search: true });
    }

    const materials = await db.courseMaterial.findMany({
      where: {
        course: { userId: user.id },
        ...(courseId ? { courseId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        type: true,
        courseId: true,
        url: true,
        filePath: true,
        extractedText: true,
        createdAt: true,
        updatedAt: true,
        course: { select: { title: true, code: true } },
      },
    });

    return NextResponse.json({
      success: true,
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        courseId: m.courseId,
        courseTitle: readableCourseTitle(m.course.title, m.course.code),
        url: m.url,
        hasFile: Boolean(m.filePath),
        hasExtractedText: Boolean(m.extractedText?.trim()),
        previewText: (m.extractedText ?? "").trim().slice(0, 240) || null,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      search: false,
    });
  } catch (error) {
    console.error("List materials failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not list materials." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const contentType = request.headers.get("content-type") ?? "";

    let courseId = "";
    let title = "";
    let typeRaw: string | null = null;
    let source = "file";
    let text = "";
    let url: string | null = null;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      courseId = String(form.get("courseId") ?? "");
      title = String(form.get("title") ?? "").trim();
      typeRaw = form.get("type") ? String(form.get("type")) : null;
      source = String(form.get("source") ?? "file");
      text = String(form.get("text") ?? "").trim();
      url = form.get("url") ? String(form.get("url")).trim() : null;
      const uploaded = form.get("file");
      if (uploaded instanceof File && uploaded.size > 0) file = uploaded;
    } else {
      const body = (await request.json()) as {
        courseId?: string;
        title?: string;
        type?: string;
        source?: string;
        text?: string;
        url?: string;
      };
      courseId = body.courseId ?? "";
      title = (body.title ?? "").trim();
      typeRaw = body.type ?? null;
      source = body.source ?? "paste";
      text = (body.text ?? "").trim();
      url = body.url?.trim() || null;
    }

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course is required." }, { status: 400 });
    }

    const course = await db.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true, title: true, code: true },
    });
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
    }

    let filePath: string | null = null;
    let extractedText: string | null = text || null;
    const appSettings = await getUserAppSettings(user.id);

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        extractedText = await extractTextFromFile(buffer, file.type, file.name, {
          includeOpenAIPro: appSettings.aiUseOpenAIPro,
        });
      } catch (error) {
        if (fileNeedsVisionOcr(file.type, file.name)) {
          return NextResponse.json(
            { success: false, error: visionOcrFailureMessage(error) },
            { status: 422 },
          );
        }
        if (isPptxFile(file.type, file.name)) {
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Could not extract text from this PowerPoint.",
            },
            { status: 422 },
          );
        }
        console.warn("Material text extract failed:", error);
        extractedText = extractedText || "";
      }

      const ocrWeak = visionOcrUnusableReason(file.type, file.name, extractedText);
      if (ocrWeak) {
        return NextResponse.json({ success: false, error: ocrWeak }, { status: 422 });
      }

      const saved = await saveMaterialFile(buffer, file.name);
      filePath = saved.filePath;
      if (!title) title = file.name.replace(/\.[^.]+$/, "") || file.name;
    }

    if (!title) {
      if (source === "paste") title = "Pasted reading";
      else if (source === "bookstore") title = "Bookstore / textbook";
      else if (source === "lms") title = "LMS material";
      else if (source === "cloud") title = "Cloud file";
      else title = "Course material";
    }

    if (!extractedText?.trim() && !filePath && !url) {
      return NextResponse.json(
        {
          success: false,
          error: "Add a file, paste text, or provide a link.",
        },
        { status: 400 },
      );
    }

    const inferred = inferMaterialType({
      fileName: file?.name,
      mimeType: file?.type,
      title,
      source,
    });
    const type = resolveType(typeRaw, inferred);

    const maxSort = await db.courseMaterial.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });

    const material = await db.courseMaterial.create({
      data: {
        courseId,
        title,
        type,
        url,
        filePath,
        extractedText: extractedText?.trim() || null,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        filePath: true,
        extractedText: true,
        courseId: true,
        createdAt: true,
      },
    });

    let topicsCreated = 0;
    const textForColdStart = material.extractedText?.trim() ?? "";
    const looksLikeSyllabus =
      type === MaterialType.SYLLABUS ||
      /syllabus|course outline|learning outcomes|week\s*\d/i.test(textForColdStart);
    const usedOcr = Boolean(file && fileNeedsVisionOcr(file.type, file.name));

    // Cold start: OCR photo / syllabus text → course topics (no paste required later).
    if (textForColdStart.length >= 120 && looksLikeSyllabus) {
      try {
        const enriched = await enrichCourseFromSyllabus({
          userId: user.id,
          courseId,
          syllabusText: textForColdStart.slice(0, 40000),
          courseTitle: readableCourseTitle(course.title, course.code),
          courseCode: course.code,
        });
        topicsCreated = enriched.topicsCreated;
        if (topicsCreated === 0) {
          topicsCreated = await seedTopicsFromSyllabusOutline(
            courseId,
            textForColdStart.slice(0, 40000),
          );
        }
      } catch (error) {
        console.warn("Syllabus enrich after material upload failed:", error);
        try {
          topicsCreated = await seedTopicsFromSyllabusOutline(
            courseId,
            textForColdStart.slice(0, 40000),
          );
        } catch (seedError) {
          console.warn("Syllabus outline topic seed failed:", seedError);
        }
      }
    } else if (usedOcr && textForColdStart.length >= 40) {
      try {
        await getOrCreateDefaultTopic(courseId);
        const existing = await db.topic.findFirst({
          where: { courseId, name: title.slice(0, 120) },
          select: { id: true },
        });
        if (!existing) {
          const maxTopic = await db.topic.aggregate({
            where: { courseId },
            _max: { sortOrder: true },
          });
          await db.topic.create({
            data: {
              courseId,
              name: title.slice(0, 120),
              description: `From photo OCR · ${title}`.slice(0, 240),
              sortOrder: (maxTopic._max.sortOrder ?? 0) + 1,
            },
          });
          topicsCreated = 1;
        }
      } catch (error) {
        console.warn("OCR topic seed failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        courseTitle: readableCourseTitle(course.title, course.code),
        source,
        ocr: usedOcr,
        topicsCreated,
      },
    });
  } catch (error) {
    console.error("Add course material failed:", error);
    const message = error instanceof Error ? error.message : "Could not add material.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => ({}))) as {
      ids?: unknown;
      id?: unknown;
    };
    const rawIds = Array.isArray(body.ids)
      ? body.ids
      : typeof body.id === "string"
        ? [body.id]
        : [];
    const ids = rawIds
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Material id is required." },
        { status: 400 },
      );
    }

    const owned = await db.courseMaterial.findMany({
      where: { id: { in: ids }, course: { userId: user.id } },
      select: { id: true, filePath: true },
    });

    if (owned.length === 0) {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 },
      );
    }

    const ownedIds = owned.map((m) => m.id);
    await db.courseMaterial.deleteMany({
      where: { id: { in: ownedIds } },
    });

    await Promise.all(
      owned.map(async (material) => {
        if (!material.filePath) return;
        try {
          await unlink(material.filePath);
        } catch {
          // File may already be gone — DB row is the source of truth.
        }
      }),
    );

    return NextResponse.json({
      success: true,
      data: { deleted: ownedIds.length, ids: ownedIds },
    });
  } catch (error) {
    console.error("Failed to delete materials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete materials." },
      { status: 500 },
    );
  }
}
