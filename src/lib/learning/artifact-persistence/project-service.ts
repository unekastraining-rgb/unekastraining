/**
 * 2P-50 — Server helpers for Note-backed multi-file projects.
 * Session user authoritative; never trusts client ownerId.
 */

import { emptyDocument } from "@/lib/core/note-types";
import { db } from "@/lib/db";
import {
  addProjectFileRef,
  emptyMultiFileProjectMeta,
  parseMultiFileProjectMeta,
  removeProjectFileRef,
  renameProjectFileRef,
  type ArtifactType,
  type MultiFileProjectMeta,
} from "@/lib/learning/artifact-persistence";
import type { SchoolContext } from "@/lib/learning/school-lms/school-context";

function readProjectMetaFromNote(contentJson: string | null): MultiFileProjectMeta | null {
  if (!contentJson) return null;
  try {
    const doc = JSON.parse(contentJson) as {
      metadata?: { multiFileProject?: unknown };
    };
    return parseMultiFileProjectMeta(doc.metadata?.multiFileProject ?? null);
  } catch {
    return null;
  }
}

function writeProjectMetaIntoContentJson(
  contentJson: string | null,
  meta: MultiFileProjectMeta,
  titleFallback: string,
): string {
  let doc: Record<string, unknown>;
  try {
    doc = contentJson ? (JSON.parse(contentJson) as Record<string, unknown>) : {};
  } catch {
    doc = {};
  }
  const base = emptyDocument();
  const merged = {
    ...base,
    ...doc,
    typed:
      typeof doc.typed === "string"
        ? doc.typed
        : `Project: ${titleFallback}`,
    metadata: {
      ...((doc.metadata as object) ?? {}),
      multiFileProject: meta,
    },
  };
  return JSON.stringify(merged);
}

export async function createOwnedMultiFileProject(input: {
  userId: string;
  title: string;
  courseId?: string | null;
  assignmentId?: string | null;
  schoolContext?: SchoolContext | null;
}): Promise<{
  projectNoteId: string;
  meta: MultiFileProjectMeta;
  updatedAt: string;
}> {
  const title = input.title.trim() || "Untitled project";

  let courseId: string | null = null;
  if (input.courseId?.trim()) {
    const course = await db.course.findFirst({
      where: { id: input.courseId.trim(), userId: input.userId },
      select: { id: true },
    });
    courseId = course?.id ?? null;
  }

  // Create container note first to get id, then stamp meta.projectId.
  const note = await db.note.create({
    data: {
      userId: input.userId,
      title,
      content: title,
      contentJson: JSON.stringify(emptyDocument()),
      courseId,
      method: "BLANK",
    },
  });

  let meta = emptyMultiFileProjectMeta(note.id);
  if (input.schoolContext) {
    meta = {
      ...meta,
      schoolContext: {
        ...input.schoolContext,
        courseId: courseId ?? input.schoolContext.courseId,
        assignmentId:
          input.assignmentId?.trim() || input.schoolContext.assignmentId,
      },
    };
  } else if (courseId || input.assignmentId) {
    meta = {
      ...meta,
      schoolContext: {
        courseId,
        assignmentId: input.assignmentId?.trim() || null,
        materialId: null,
        source: "manual",
        term: null,
      },
    };
  }

  const contentJson = writeProjectMetaIntoContentJson(null, meta, title);
  const updated = await db.note.update({
    where: { id: note.id },
    data: { contentJson, content: title },
  });

  return {
    projectNoteId: updated.id,
    meta,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function getOwnedProjectMeta(input: {
  userId: string;
  projectNoteId: string;
}): Promise<{
  note: { id: string; title: string | null; updatedAt: Date; contentJson: string | null };
  meta: MultiFileProjectMeta;
} | null> {
  const note = await db.note.findFirst({
    where: { id: input.projectNoteId, userId: input.userId },
    select: { id: true, title: true, updatedAt: true, contentJson: true },
  });
  if (!note) return null;
  const meta = readProjectMetaFromNote(note.contentJson);
  if (!meta || meta.projectId !== note.id) return null;
  return { note, meta };
}

export async function addOwnedProjectFile(input: {
  userId: string;
  projectNoteId: string;
  title: string;
  artifactType?: ArtifactType;
  expectedUpdatedAt?: string | null;
}): Promise<
  | { ok: true; fileNoteId: string; meta: MultiFileProjectMeta; projectUpdatedAt: string }
  | { ok: false; status: 404 | 409; error: string; code?: string }
> {
  const owned = await getOwnedProjectMeta({
    userId: input.userId,
    projectNoteId: input.projectNoteId,
  });
  if (!owned) {
    return { ok: false, status: 404, error: "Project not found." };
  }

  if (input.expectedUpdatedAt?.trim()) {
    const expected = new Date(input.expectedUpdatedAt);
    if (
      !Number.isNaN(expected.getTime()) &&
      owned.note.updatedAt.getTime() !== expected.getTime()
    ) {
      return {
        ok: false,
        status: 409,
        error: "Project was updated elsewhere. Reload and try again.",
        code: "stale_note",
      };
    }
  }

  const fileTitle = input.title.trim() || "Untitled file";
  const artifactType = input.artifactType ?? "NOTE";
  const fileNote = await db.note.create({
    data: {
      userId: input.userId,
      title: fileTitle,
      content: "",
      contentJson: JSON.stringify({
        ...emptyDocument(),
        typed: "",
        metadata: {
          projectFileOf: owned.note.id,
          artifactType,
        },
      }),
      method: "BLANK",
    },
  });

  const meta = addProjectFileRef(owned.meta, {
    noteId: fileNote.id,
    title: fileTitle,
    artifactType,
  });

  const contentJson = writeProjectMetaIntoContentJson(
    owned.note.contentJson,
    meta,
    owned.note.title ?? "Project",
  );
  const updated = await db.note.update({
    where: { id: owned.note.id },
    data: { contentJson },
  });

  return {
    ok: true,
    fileNoteId: fileNote.id,
    meta,
    projectUpdatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateOwnedProjectMeta(input: {
  userId: string;
  projectNoteId: string;
  meta: MultiFileProjectMeta;
  expectedUpdatedAt?: string | null;
}): Promise<
  | { ok: true; meta: MultiFileProjectMeta; updatedAt: string }
  | { ok: false; status: 404 | 409; error: string; code?: string }
> {
  const owned = await getOwnedProjectMeta({
    userId: input.userId,
    projectNoteId: input.projectNoteId,
  });
  if (!owned) {
    return { ok: false, status: 404, error: "Project not found." };
  }
  if (input.expectedUpdatedAt?.trim()) {
    const expected = new Date(input.expectedUpdatedAt);
    if (
      !Number.isNaN(expected.getTime()) &&
      owned.note.updatedAt.getTime() !== expected.getTime()
    ) {
      return {
        ok: false,
        status: 409,
        error: "Project was updated elsewhere. Reload and try again.",
        code: "stale_note",
      };
    }
  }

  const meta = {
    ...input.meta,
    projectId: owned.note.id,
    version: 1 as const,
  };
  const contentJson = writeProjectMetaIntoContentJson(
    owned.note.contentJson,
    meta,
    owned.note.title ?? "Project",
  );
  const updated = await db.note.update({
    where: { id: owned.note.id },
    data: { contentJson },
  });
  return { ok: true, meta, updatedAt: updated.updatedAt.toISOString() };
}

export async function renameOwnedProjectFile(input: {
  userId: string;
  projectNoteId: string;
  fileNoteId: string;
  title: string;
  expectedUpdatedAt?: string | null;
}) {
  const owned = await getOwnedProjectMeta({
    userId: input.userId,
    projectNoteId: input.projectNoteId,
  });
  if (!owned) {
    return { ok: false as const, status: 404 as const, error: "Project not found." };
  }
  if (!owned.meta.files.some((f) => f.noteId === input.fileNoteId)) {
    return { ok: false as const, status: 404 as const, error: "File not found." };
  }

  const file = await db.note.findFirst({
    where: { id: input.fileNoteId, userId: input.userId },
    select: { id: true },
  });
  if (!file) {
    return { ok: false as const, status: 404 as const, error: "File not found." };
  }

  const title = input.title.trim() || "Untitled file";
  await db.note.update({
    where: { id: file.id },
    data: { title },
  });

  const meta = renameProjectFileRef(owned.meta, file.id, title);
  return updateOwnedProjectMeta({
    userId: input.userId,
    projectNoteId: input.projectNoteId,
    meta,
    expectedUpdatedAt: input.expectedUpdatedAt,
  });
}

export async function removeOwnedProjectFile(input: {
  userId: string;
  projectNoteId: string;
  fileNoteId: string;
  deleteNote?: boolean;
  expectedUpdatedAt?: string | null;
}) {
  const owned = await getOwnedProjectMeta({
    userId: input.userId,
    projectNoteId: input.projectNoteId,
  });
  if (!owned) {
    return { ok: false as const, status: 404 as const, error: "Project not found." };
  }
  if (!owned.meta.files.some((f) => f.noteId === input.fileNoteId)) {
    return { ok: false as const, status: 404 as const, error: "File not found." };
  }

  if (input.deleteNote) {
    await db.note.deleteMany({
      where: { id: input.fileNoteId, userId: input.userId },
    });
  }

  const meta = removeProjectFileRef(owned.meta, input.fileNoteId);
  return updateOwnedProjectMeta({
    userId: input.userId,
    projectNoteId: input.projectNoteId,
    meta,
    expectedUpdatedAt: input.expectedUpdatedAt,
  });
}
