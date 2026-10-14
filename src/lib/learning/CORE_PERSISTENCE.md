# CORE_PERSISTENCE — 2P-50

CORE notebooks remain durable via `Note.contentJson`.

## Flow

```text
open → edit → autosave (~900ms debounce) → manual save → navigate / reload → reopen
```

## Hardened behaviors

| Concern | Behavior |
| --- | --- |
| Autosave | Debounced; uses `docRef` + `prepareNoteDocumentForSave` |
| Save generation | Newest in-flight save wins UX (`shouldApplySaveResult`) |
| Optimistic concurrency | `expectedUpdatedAt` → 409 stale |
| Save status | Shared `resolveArtifactSaveStatus` labels |
| Failed save | Local draft cache + visible error (not false Saved) |
| Ink / pages | Notebook pages sync on save; SketchLayer ResizeObserver + provisional size |
| Evidence | Notes APIs never write LearningAttempt / ConceptMastery |

## Canvas

1. Container mounts  
2. Measure layout  
3. If provisional (0×0), keep ≥1×1 and retry via ResizeObserver / rAF  
4. Hydrate strokes  
5. Interaction  

Do not hard-code fixed canvas dimensions as the primary fix.

## Pointer

Mouse, touch, and pen via Pointer Events. Pencil-only mode available. No native Pencil SDK.

## Export / import

Existing `/api/notes/export` formats unchanged. Specialized workspace buffers outside Notes remain activity-transient unless submitted as evidence previews.
