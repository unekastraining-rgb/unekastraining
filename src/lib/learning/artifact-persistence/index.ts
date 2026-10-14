/**
 * 2P-50 — Artifact persistence barrel.
 */

export {
  ARTIFACT_TYPES,
  resolveArtifactSaveStatus,
  artifactSaveStatusLabel,
  artifactPersistenceEvidenceBoundary,
  artifactPersistenceTruthSummary,
} from "./contract";
export type {
  ArtifactType,
  ArtifactSaveStatus,
  ArtifactPersistenceDescriptor,
} from "./contract";

export {
  MULTI_FILE_PROJECT_META_VERSION,
  emptyMultiFileProjectMeta,
  parseMultiFileProjectMeta,
  addProjectFileRef,
  renameProjectFileRef,
  removeProjectFileRef,
  projectFileSaveIsolationOk,
  multiFileProjectTruthSummary,
} from "./multi-file-project";
export type {
  ProjectFileRef,
  MultiFileProjectMeta,
} from "./multi-file-project";

export {
  localDraftStorageKey,
  writeLocalArtifactDraft,
  readLocalArtifactDraft,
  clearLocalArtifactDraft,
  localDraftMayOfferRecovery,
  localDraftTruthSummary,
} from "./local-draft";
export type { LocalArtifactDraft } from "./local-draft";

export {
  activityDraftStorageKey,
  buildActivityDraftKey,
  writeActivityLocalDraft,
  readActivityLocalDraft,
  clearActivityLocalDraft,
  activityLocalDraftTruthSummary,
} from "./activity-local-draft";
export type { ActivityLocalDraft } from "./activity-local-draft";
