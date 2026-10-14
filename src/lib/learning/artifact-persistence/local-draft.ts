/**
 * 2P-50 — Local draft cache for save-failure recovery.
 * Enhancement only — never the source of truth vs server Note.
 */

export type LocalArtifactDraft = {
  noteId: string;
  contentJson: string;
  title: string | null;
  savedAt: string;
  serverUpdatedAt: string | null;
};

const PREFIX = "study-haul-artifact-draft-v1:";

export function localDraftStorageKey(noteId: string): string {
  return `${PREFIX}${noteId.trim()}`;
}

export function writeLocalArtifactDraft(
  draft: LocalArtifactDraft,
  storage: Pick<Storage, "setItem"> = globalThis.localStorage,
): void {
  if (typeof storage?.setItem !== "function") return;
  const id = draft.noteId.trim();
  if (!id || !draft.contentJson) return;
  try {
    storage.setItem(
      localDraftStorageKey(id),
      JSON.stringify({
        ...draft,
        noteId: id,
        savedAt: draft.savedAt || new Date().toISOString(),
      }),
    );
  } catch {
    /* quota / private mode — ignore */
  }
}

export function readLocalArtifactDraft(
  noteId: string,
  storage: Pick<Storage, "getItem"> = globalThis.localStorage,
): LocalArtifactDraft | null {
  if (typeof storage?.getItem !== "function") return null;
  const id = noteId.trim();
  if (!id) return null;
  try {
    const raw = storage.getItem(localDraftStorageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalArtifactDraft;
    if (
      !parsed ||
      parsed.noteId !== id ||
      typeof parsed.contentJson !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalArtifactDraft(
  noteId: string,
  storage: Pick<Storage, "removeItem"> = globalThis.localStorage,
): void {
  if (typeof storage?.removeItem !== "function") return;
  try {
    storage.removeItem(localDraftStorageKey(noteId.trim()));
  } catch {
    /* ignore */
  }
}

/**
 * Reconcile: never silently overwrite newer server with older draft.
 * Returns whether the local draft may be offered as recovery UI.
 */
export function localDraftMayOfferRecovery(input: {
  draft: LocalArtifactDraft | null;
  serverUpdatedAt: string | null;
  serverContentJson: string | null;
}): boolean {
  const d = input.draft;
  if (!d?.contentJson) return false;
  if (
    input.serverContentJson &&
    d.contentJson === input.serverContentJson
  ) {
    return false;
  }
  // If we know the draft was based on an older server version, still offer
  // recovery (learner may have unsaved work) — never auto-apply.
  return true;
}

export function localDraftTruthSummary(): {
  localDraftIsNotSourceOfTruth: true;
  neverSilentlyOverwriteServer: true;
  recoveryIsOptIn: true;
} {
  return {
    localDraftIsNotSourceOfTruth: true,
    neverSilentlyOverwriteServer: true,
    recoveryIsOptIn: true,
  };
}
