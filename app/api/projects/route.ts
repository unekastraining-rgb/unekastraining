import { NextResponse } from "next/server";

import { jsonErrorFromUnknown } from "@/lib/api/http-errors";
import {
  addOwnedProjectFile,
  createOwnedMultiFileProject,
  getOwnedProjectMeta,
  removeOwnedProjectFile,
  renameOwnedProjectFile,
} from "@/lib/learning/artifact-persistence/project-service";
import type { ArtifactType } from "@/lib/learning/artifact-persistence";
import { getOrCreateDefaultUser } from "@/lib/user";

/**
 * 2P-50 — Multi-file projects (Note-backed container).
 * Session identity authoritative; client userId ignored.
 */
export async function GET(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")?.trim() ?? "";
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId required." },
        { status: 400 },
      );
    }

    const owned = await getOwnedProjectMeta({
      userId: user.id,
      projectNoteId: projectId,
    });
    if (!owned) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId: owned.note.id,
        title: owned.note.title,
        updatedAt: owned.note.updatedAt.toISOString(),
        meta: owned.meta,
        createsEvidence: false,
        createsMastery: false,
      },
    });
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to load project.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateDefaultUser();
    const body = (await request.json().catch(() => null)) as {
      action?: unknown;
      title?: unknown;
      projectId?: unknown;
      fileTitle?: unknown;
      artifactType?: unknown;
      courseId?: unknown;
      assignmentId?: unknown;
      expectedUpdatedAt?: unknown;
      userId?: unknown;
      ownerId?: unknown;
    } | null;

    // Ignore client identity spoofing.
    void body?.userId;
    void body?.ownerId;

    const action =
      typeof body?.action === "string" ? body.action.trim() : "create";

    if (action === "create") {
      const title =
        typeof body?.title === "string" ? body.title : "Untitled project";
      const created = await createOwnedMultiFileProject({
        userId: user.id,
        title,
        courseId:
          typeof body?.courseId === "string" ? body.courseId : null,
        assignmentId:
          typeof body?.assignmentId === "string" ? body.assignmentId : null,
      });
      return NextResponse.json(
        {
          success: true,
          data: {
            projectId: created.projectNoteId,
            meta: created.meta,
            updatedAt: created.updatedAt,
            createsEvidence: false,
            createsMastery: false,
          },
        },
        { status: 201 },
      );
    }

    if (action === "add-file") {
      const projectId =
        typeof body?.projectId === "string" ? body.projectId.trim() : "";
      if (!projectId) {
        return NextResponse.json(
          { success: false, error: "projectId required." },
          { status: 400 },
        );
      }
      const result = await addOwnedProjectFile({
        userId: user.id,
        projectNoteId: projectId,
        title:
          typeof body?.fileTitle === "string"
            ? body.fileTitle
            : typeof body?.title === "string"
              ? body.title
              : "Untitled file",
        artifactType:
          typeof body?.artifactType === "string"
            ? (body.artifactType as ArtifactType)
            : "NOTE",
        expectedUpdatedAt:
          typeof body?.expectedUpdatedAt === "string"
            ? body.expectedUpdatedAt
            : null,
      });
      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            code: "code" in result ? result.code : undefined,
          },
          { status: result.status },
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          projectId,
          fileNoteId: result.fileNoteId,
          meta: result.meta,
          updatedAt: result.projectUpdatedAt,
          createsEvidence: false,
          createsMastery: false,
        },
      });
    }

    if (action === "rename-file") {
      const projectId =
        typeof body?.projectId === "string" ? body.projectId.trim() : "";
      const fileNoteId =
        typeof (body as { fileNoteId?: unknown })?.fileNoteId === "string"
          ? String((body as { fileNoteId: string }).fileNoteId).trim()
          : "";
      if (!projectId || !fileNoteId) {
        return NextResponse.json(
          { success: false, error: "projectId and fileNoteId required." },
          { status: 400 },
        );
      }
      const result = await renameOwnedProjectFile({
        userId: user.id,
        projectNoteId: projectId,
        fileNoteId,
        title:
          typeof body?.fileTitle === "string"
            ? body.fileTitle
            : typeof body?.title === "string"
              ? body.title
              : "Untitled file",
        expectedUpdatedAt:
          typeof body?.expectedUpdatedAt === "string"
            ? body.expectedUpdatedAt
            : null,
      });
      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            code: "code" in result ? result.code : undefined,
          },
          { status: result.status },
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          projectId,
          meta: result.meta,
          updatedAt: result.updatedAt,
          createsEvidence: false,
        },
      });
    }

    if (action === "remove-file") {
      const projectId =
        typeof body?.projectId === "string" ? body.projectId.trim() : "";
      const fileNoteId =
        typeof (body as { fileNoteId?: unknown })?.fileNoteId === "string"
          ? String((body as { fileNoteId: string }).fileNoteId).trim()
          : "";
      if (!projectId || !fileNoteId) {
        return NextResponse.json(
          { success: false, error: "projectId and fileNoteId required." },
          { status: 400 },
        );
      }
      const result = await removeOwnedProjectFile({
        userId: user.id,
        projectNoteId: projectId,
        fileNoteId,
        deleteNote: true,
        expectedUpdatedAt:
          typeof body?.expectedUpdatedAt === "string"
            ? body.expectedUpdatedAt
            : null,
      });
      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            code: "code" in result ? result.code : undefined,
          },
          { status: result.status },
        );
      }
      return NextResponse.json({
        success: true,
        data: {
          projectId,
          meta: result.meta,
          updatedAt: result.updatedAt,
          createsEvidence: false,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    return jsonErrorFromUnknown(error, "Failed to update project.");
  }
}
