# Material Context (2P-28)

Source-grounded **learning context** on top of 2P-27.  
Context ≠ Evidence ≠ Mastery. Not a RAG platform or second engine.

## Material context contract

```ts
type LearningMaterialContext = {
  materialId: string
  title: string
  sourceType?: string | null
  learningSpaceId?: string | null
  courseId?: string | null
  conceptId?: string | null
  noteId?: string | null
  extractionState?: "READY" | "PARTIAL" | ...
  provenance: { label: string; section?; page?; anchor? }
  partial?: boolean
  relatedSources?: Array<{ materialId; title; provenanceLabel }>
}
```

Optional, learner-owned, serializable, display-only.

## Ownership

Resolved only with session `userId` via `loadMaterialForUser` / `course.userId`.  
Client `learnerId` / `userId` ignored. Foreign material → `null` (no title leak).

## Provenance

Learner-facing: `Source: Java Chapter 11` / `Source: Chapter 11, Section 11.2`.  
Never invent page numbers. Never show DB ids.

## Context resolution & priority

`resolveLearningMaterialContext`:

1. **explicit** — start/URL `materialId` (owned)
2. **activity** — activity query `materialId`
3. **concept** — Notes with `learningKnowledge.linkedConceptIds` + `materialId`
4. **learning_space** — newest material on space’s course
5. **none**

Multiple concept-linked sources preserved in `relatedSources`; primary = most recently updated.

## CORE

Workbook `Note.materialId` + `metadata.materialSource` remain document truth.  
Citation actions: **Open in CORE** / **View materials**.

## Tutor

Owned `materialId` → instructional context + response `meta.materialProvenanceLabel`.  
No fabricated citations. Ordinary Q&A: `evidenceIntent: "none"`.

## Adaptive

Optional `materialId` on start (validated) + run URL.  
`loadAdaptiveRunPageView` resolves context (explicit or reverse-lookup).  
Citation strip + “Why this step?” appends provenance.  
**Does not** change Orchestrator diagnosis or run lifecycle.

Resume: reverse-lookup by concept keeps citation when URL omits `materialId`.

## Activity

`universalActivityAdaptiveHref` may include `materialId`.  
`ActivityWorkspace` shows optional `MaterialSourceCitation`.  
Activity remains universal — source is chrome only.

## LearningSpace

Optional. Standalone / no-course LearningSpace still works. Course is not universal root.

## Evidence / mastery / LUCKY

| Action | LearningAttempt |
| --- | --- |
| Resolve / display / view source / open material | No |
| Tutor source chip | No |
| Real activity submit | Existing path |

LUCKY unchanged — no MaterialRetention.

## Partial / stale

`PARTIAL` → `partial: true` + learner notice.  
Context built from current owned `CourseMaterial` + note metadata (no silent old-source claim beyond current rows).

## Security

Foreign materialId on Adaptive start → `materialId: null` in response.  
Foreign Tutor materialId → no provenance meta.  
User B cannot attach User A material as context.

## Accessibility / responsive

Citation uses semantic `<aside>`, `aria-label`, `min-h-11` touch targets, no hover-only controls.
