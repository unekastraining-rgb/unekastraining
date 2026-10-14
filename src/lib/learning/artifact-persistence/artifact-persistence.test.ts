/**
 * 2P-50 — Artifact persistence / multi-file / local draft / canvas sizing.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  resolveCanvasCssSize,
  computeCanvasBufferPixels,
  shouldApplySaveResult,
} from "@/lib/core/canvas-buffer-size";
import {
  resolveArtifactSaveStatus,
  artifactSaveStatusLabel,
  artifactPersistenceTruthSummary,
  emptyMultiFileProjectMeta,
  addProjectFileRef,
  removeProjectFileRef,
  renameProjectFileRef,
  projectFileSaveIsolationOk,
  multiFileProjectTruthSummary,
  writeLocalArtifactDraft,
  readLocalArtifactDraft,
  clearLocalArtifactDraft,
  localDraftMayOfferRecovery,
  localDraftTruthSummary,
  parseMultiFileProjectMeta,
} from "@/lib/learning/artifact-persistence";

function read(rel: string) {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("2P-50 canvas initialization helpers", () => {
  it("marks 0×0 measure as provisional and never returns zero css size", () => {
    const size = resolveCanvasCssSize({
      measureClientWidth: 0,
      measureClientHeight: 0,
    });
    expect(size.cssW).toBeGreaterThanOrEqual(1);
    expect(size.cssH).toBeGreaterThanOrEqual(1);
    expect(size.provisional).toBe(true);
  });

  it("uses real measurements when available", () => {
    const size = resolveCanvasCssSize({
      measureClientWidth: 800,
      measureClientHeight: 600,
    });
    expect(size.cssW).toBe(800);
    expect(size.cssH).toBe(600);
    expect(size.provisional).toBe(false);
  });

  it("buffer pixels stay ≥1", () => {
    const buf = computeCanvasBufferPixels(1, 1, 2);
    expect(buf.bw).toBeGreaterThanOrEqual(1);
    expect(buf.bh).toBeGreaterThanOrEqual(1);
  });

  it("newest save generation wins UX updates", () => {
    expect(shouldApplySaveResult(3, 3)).toBe(true);
    expect(shouldApplySaveResult(2, 3)).toBe(false);
  });
});

describe("2P-50 artifact save status", () => {
  it("never labels Saved while saving or dirty", () => {
    expect(
      resolveArtifactSaveStatus({
        saving: true,
        saveError: null,
        dirty: true,
        lastSavedAt: new Date(),
      }),
    ).toBe("saving");
    expect(
      resolveArtifactSaveStatus({
        saving: false,
        saveError: null,
        dirty: true,
        lastSavedAt: new Date(),
      }),
    ).toBe("unsaved");
    expect(artifactSaveStatusLabel("failed")).toBe("Save failed");
    expect(artifactSaveStatusLabel("conflict")).toMatch(/elsewhere/i);
  });

  it("truth: server authoritative; edit ≠ evidence; no second engines", () => {
    const t = artifactPersistenceTruthSummary();
    expect(t.serverBackedIsAuthoritative).toBe(true);
    expect(t.editIsNotEvidence).toBe(true);
    expect(t.autosaveIsNotEvidence).toBe(true);
    expect(t.inventsArtifactMastery).toBe(false);
    expect(t.inventsSecondDocumentModel).toBe(false);
    expect(t.mobileIsDeviceShell).toBe(true);
    expect(t.claimsNativePencilSdk).toBe(false);
    expect(t.noDatabaseMigrationRequired).toBe(true);
  });
});

describe("2P-50 multi-file project (Note-backed)", () => {
  it("add/rename/remove refs without inventing a Project engine", () => {
    let meta = emptyMultiFileProjectMeta("proj-1");
    meta = addProjectFileRef(meta, {
      noteId: "file-a",
      title: "Notes",
      artifactType: "NOTE",
    });
    meta = addProjectFileRef(meta, {
      noteId: "file-b",
      title: "Code",
      artifactType: "CODE",
    });
    expect(meta.files).toHaveLength(2);
    meta = renameProjectFileRef(meta, "file-a", "Research");
    expect(meta.files.find((f) => f.noteId === "file-a")?.title).toBe(
      "Research",
    );
    meta = removeProjectFileRef(meta, "file-b");
    expect(meta.files).toHaveLength(1);
    expect(projectFileSaveIsolationOk({
      fileANoteId: "file-a",
      fileBNoteId: "file-b",
      savedNoteId: "file-a",
    })).toBe(true);
    const t = multiFileProjectTruthSummary();
    expect(t.inventsProjectEngine).toBe(false);
    expect(t.fileSaveIsolatedByNoteId).toBe(true);
    expect(t.noPrismaProjectTable).toBe(true);
  });

  it("parse rejects non-v1 garbage", () => {
    expect(parseMultiFileProjectMeta({ version: 2, projectId: "x" })).toBeNull();
    expect(
      parseMultiFileProjectMeta({
        version: 1,
        projectId: "p1",
        files: [{ noteId: "n1", title: "A", artifactType: "NOTE", order: 0 }],
      })?.files[0].noteId,
    ).toBe("n1");
  });
});

describe("2P-50 local draft recovery", () => {
  it("stores and clears drafts without auto-overwriting server", () => {
    const mem = new Map<string, string>();
    const storage = {
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      getItem: (k: string) => mem.get(k) ?? null,
      removeItem: (k: string) => {
        mem.delete(k);
      },
    };
    writeLocalArtifactDraft(
      {
        noteId: "n1",
        contentJson: '{"typed":"draft"}',
        title: "T",
        savedAt: "2026-01-01T00:00:00.000Z",
        serverUpdatedAt: "2026-01-01T00:00:00.000Z",
      },
      storage,
    );
    expect(readLocalArtifactDraft("n1", storage)?.contentJson).toContain(
      "draft",
    );
    expect(
      localDraftMayOfferRecovery({
        draft: readLocalArtifactDraft("n1", storage),
        serverUpdatedAt: "2026-01-02T00:00:00.000Z",
        serverContentJson: '{"typed":"server"}',
      }),
    ).toBe(true);
    expect(
      localDraftMayOfferRecovery({
        draft: readLocalArtifactDraft("n1", storage),
        serverUpdatedAt: null,
        serverContentJson: '{"typed":"draft"}',
      }),
    ).toBe(false);
    clearLocalArtifactDraft("n1", storage);
    expect(readLocalArtifactDraft("n1", storage)).toBeNull();
    expect(localDraftTruthSummary().neverSilentlyOverwriteServer).toBe(true);
  });
});

describe("2P-50 surface wiring integrity", () => {
  it("CORE save uses status + local draft helpers; notes API has stale_note", () => {
    const ws = read("src/components/core/CoreNotesWorkspace.tsx");
    expect(ws).toContain("writeLocalArtifactDraft");
    expect(ws).toContain("resolveArtifactSaveStatus");
    expect(ws).toContain("data-core-save-status");
    expect(ws).toContain("ProjectFileNavigator");
    const notes = read("app/api/notes/[id]/route.ts");
    expect(notes).toContain("stale_note");
    expect(notes).not.toMatch(/recordEvidence|LearningAttempt|ConceptMastery/);
    const projects = read("app/api/projects/route.ts");
    expect(projects).toContain("createOwnedMultiFileProject");
    expect(projects).toContain("void body?.userId");
    expect(projects).toContain("createsEvidence: false");
  });

  it("SketchLayer still uses resolveCanvasCssSize + ResizeObserver", () => {
    const sketch = read("src/components/core/SketchLayer.tsx");
    expect(sketch).toContain("resolveCanvasCssSize");
    expect(sketch).toContain("ResizeObserver");
    expect(sketch).toContain('pointerType === "pen"');
  });
});
