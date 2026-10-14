# ARTIFACT_PERSISTENCE — 2P-50

**Server-backed artifact state is authoritative.**

**Artifact persistence does not automatically create learning evidence.**

**Mobile/iPad is a device shell over the same universal learning system.**

Architecture remains: **CORE → SIX → LUCKY** · one ULE spine.

---

## Contract

Descriptors (optional fields) sit on existing `Note` rows:

| Field | Source |
| --- | --- |
| id / owner | `Note.id` / session `userId` |
| type | Soft `metadata.artifactType` |
| content / version | `contentJson` / `updatedAt` |
| schoolContext | Optional 2P-49 provenance |
| project | `metadata.multiFileProject` on container note |

Editing / autosave / open ≠ `LearningAttempt`. Meaningful submit remains the evidence boundary (2P-47).

Helpers: `src/lib/learning/artifact-persistence/`.

---

## Save states

`idle` · `unsaved` · `saving` · `saved` · `failed` · `retrying` · `conflict`

CORE never shows **Saved** until the server confirms the write.

---

## Local drafts

On save failure / 409, CORE may write a **local draft** (`study-haul-artifact-draft-v1:`).

- Not the source of truth
- Never silently overwrites server
- Recovery is opt-in (`localDraftMayOfferRecovery`)

---

## Concurrency

`PATCH /api/notes/[id]` with `expectedUpdatedAt` → **409 `stale_note`** on mismatch. Stale clients do not overwrite.

---

## Multi-file projects

Note-backed container (no Prisma Project table / no DB migration):

```text
Project Note (metadata.multiFileProject)
 ├── File Note A
 └── File Note B
```

Each file is a separate owned Note — saving B cannot overwrite A.

API: `GET/POST /api/projects` (`create`, `add-file`, `rename-file`, `remove-file`).

UI: `ProjectFileNavigator` in CORE Assist (when container meta present).

Activity “project” challenges (2P-47 outline submit) remain separate — mid-challenge resume still not those structured challenges.

---

## Evidence / mastery / AI

- No `ArtifactMastery` / `ProjectMastery`
- AI assistance provenance remains distinguishable (2P-47)
- School Course/Assignment may attach as optional context only

---

## Device honesty

Browser APIs: mouse / touch / pen (`pointerType`). ResizeObserver + provisional canvas sizing avoid permanent 0×0 blank ink.

**Not claimed:** native Apple Pencil SDK, physical iPad/Safari validation unless separately performed.

See also: [CORE_PERSISTENCE.md](./CORE_PERSISTENCE.md), [MULTI_FILE_PROJECTS.md](./MULTI_FILE_PROJECTS.md).
