/**
 * 2P-50 — Artifact persistence contract (read-side + shared helpers).
 * Server-backed artifact state is authoritative.
 * Artifact persistence does not automatically create learning evidence.
 * Mobile/iPad is a device shell over the same universal learning system.
 *
 * Does NOT invent a second document model — wraps existing Note / contentJson.
 */

import type { SchoolContext } from "@/lib/learning/school-lms/school-context";

/** Soft artifact kinds — map onto existing CORE / activity surfaces. */
export const ARTIFACT_TYPES = [
  "NOTE",
  "WRITING",
  "PROJECT",
  "PRESENTATION",
  "CODE",
  "SQL",
  "MATH",
  "NETWORK",
  "LANGUAGE",
  "LAB",
  "SIMULATION",
  "GAME",
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export type ArtifactSaveStatus =
  | "idle"
  | "unsaved"
  | "saving"
  | "saved"
  | "failed"
  | "retrying"
  | "conflict";

/**
 * Persistence descriptor — fields optional; Note.id is the durable artifact id.
 */
export type ArtifactPersistenceDescriptor = {
  id: string;
  ownerId: string;
  type: ArtifactType;
  title: string | null;
  /** Server `updatedAt` ISO — used for optimistic concurrency. */
  version: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sourceContext: string | null;
  schoolContext: SchoolContext | null;
  learningObjectId: string | null;
  projectId: string | null;
};

export function resolveArtifactSaveStatus(input: {
  saving: boolean;
  saveError: string | null;
  dirty: boolean;
  lastSavedAt: Date | string | null;
  conflict?: boolean;
  retrying?: boolean;
}): ArtifactSaveStatus {
  if (input.conflict) return "conflict";
  if (input.retrying) return "retrying";
  if (input.saving) return "saving";
  if (input.saveError) return "failed";
  if (input.dirty) return "unsaved";
  if (input.lastSavedAt) return "saved";
  return "idle";
}

export function artifactSaveStatusLabel(status: ArtifactSaveStatus): string {
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "unsaved":
      return "Unsaved changes";
    case "failed":
      return "Save failed";
    case "retrying":
      return "Retrying…";
    case "conflict":
      return "Updated elsewhere — reload";
    default:
      return "Save";
  }
}

/**
 * Evidence boundary — editing/saving artifacts is not LearningAttempt.
 */
export function artifactPersistenceEvidenceBoundary(): {
  openIsNotEvidence: true;
  editIsNotEvidence: true;
  autosaveIsNotEvidence: true;
  saveIsNotEvidence: true;
  addProjectFileIsNotEvidence: true;
  meaningfulSubmitMayProduceEvidence: true;
  inventsArtifactMastery: false;
  inventsProjectMastery: false;
  inventsSecondDocumentModel: false;
  inventsSecondArtifactEngine: false;
  serverBackedIsAuthoritative: true;
  localDraftIsNotSourceOfTruth: true;
  mobileIsDeviceShell: true;
  claimsNativePencilSdk: false;
} {
  return {
    openIsNotEvidence: true,
    editIsNotEvidence: true,
    autosaveIsNotEvidence: true,
    saveIsNotEvidence: true,
    addProjectFileIsNotEvidence: true,
    meaningfulSubmitMayProduceEvidence: true,
    inventsArtifactMastery: false,
    inventsProjectMastery: false,
    inventsSecondDocumentModel: false,
    inventsSecondArtifactEngine: false,
    serverBackedIsAuthoritative: true,
    localDraftIsNotSourceOfTruth: true,
    mobileIsDeviceShell: true,
    claimsNativePencilSdk: false,
  };
}

export function artifactPersistenceTruthSummary() {
  return {
    ...artifactPersistenceEvidenceBoundary(),
    usesExistingNoteContentJson: true as const,
    usesExistingOptimisticConcurrency: true as const,
    noDatabaseMigrationRequired: true as const,
  };
}
