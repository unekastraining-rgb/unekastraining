# Long-Horizon Retention (2P-52)

Additive enhancement of the existing **LUCKY / RetentionItem** engine.
Not a second retention system, planner, FSRS scheduler, decay engine, or mastery store.

Architecture remains: **CORE → SIX → LUCKY** with one ULE evidence → mastery spine.

## Contract

Retention scheduling continues to use `RetentionItem.dueAt` (authoritative for non-flashcard sources).
Flashcard SM-2 (`Flashcard.nextReviewAt`) remains authoritative for `FLASHCARD` items.

Read-side horizon states (derived from `dueAt` + now — not persisted as a new enum):

| State | Meaning |
| --- | --- |
| `NOT_DUE` | Due more than ~48h in the future |
| `UPCOMING` | Due within ~48h but still future |
| `DUE` | Due now (or null dueAt) |
| `OVERDUE` | More than ~24h past due |

Learner-facing copy is neutral:

- “Ready for a retention check”
- “Worth revisiting”
- “Coming up for another check”
- “Not due yet”

**Absence of activity is not failure. A long gap is not proof of forgetting.**
A long gap may increase the *value of checking* retention when an item becomes overdue.

## Cadence (deterministic, AI-independent)

After a RETAIN outcome, `nextReviewAtForOutcome` schedules:

| Outcome | Spacing |
| --- | --- |
| First SUCCESS | 3 days |
| 2nd consecutive SUCCESS | 7 days |
| 3rd consecutive SUCCESS | 14 days |
| 4th+ consecutive SUCCESS | 30 days |
| PARTIAL | 24 hours |
| FAIL / SKIPPED | 12 hours |

Consecutive success is tracked as `metadata.successStreak` on the RetentionItem.
Spacing never claims permanent mastery.

## Evidence boundaries

| Action | Creates RETAIN LearningAttempt? |
| --- | --- |
| Lucky GET / open / preview / due-state calc | **No** |
| Lucky submit | **Yes** → `recordEvidence` → `applyEvidenceToMastery` |
| Adaptive ACTIVE / ABANDONED / STOP | **No** handoff |
| Adaptive COMPLETED | Soft Lucky handoff (existing weak-mastery bridge; idempotent) |

## Over-review guards

- Upsert sync does **not** pull a future SUCCESS `dueAt` earlier (except `flashcard_sm2` authority).
- Candidate selection prefers overdue / recent failure / meaningful reasons; caps duplicates by source key.
- Variants avoid repeating `lastVariantId` when a legal alternate exists.
- Strong recent SUCCESS schedules stay `ACTIVE` / `NOT_DUE` — not forced into the due queue.

## Adaptive → LUCKY

`Adaptive COMPLETED → syncLuckyRetentionAfterSequenceComplete` (existing).
ACTIVE / ABANDONED / STOP do not hand off. Duplicate complete does not duplicate RetentionItems.

## Retention → Mastery

`Lucky submit → LearningAttempt(RETAIN) → ConceptMastery` via existing evidence path.
No parallel mastery path. No blind mastery decay from time alone.

## Growth / continuity

Growth Center and Hub teaser soft-surface `OPEN_LUCKY` when due retention exists and Adaptive has nothing to resume — not a planner.
Continuity notes may mention a ready retention check using factual language only.

## Testing with simulated time

Unit tests inject `now` / fake `Date` values. Do not wait real days/weeks in CI.

## What remains deferred

- Physical multi-week device validation
- Optional richer Growth charts of retention outcomes over months (same store — presentation only)
- Product expansion beyond the planned roadmap
