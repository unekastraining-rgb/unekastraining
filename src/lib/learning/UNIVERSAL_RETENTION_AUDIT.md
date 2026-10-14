# UNIVERSAL_RETENTION_AUDIT — 2P-38

**Mode:** Deepen LUCKY retention inside existing architecture  
**Rule:** One RetentionItem SoT · no second engine · COMPLETE-only Adaptive handoff  
**Predecessor docs:** `LUCKY_ULE_RETENTION_INTEGRATION.md`

---

## 1. How LUCKY currently works

Two loosely coupled surfaces:

| Surface | Location | Role |
|---------|----------|------|
| **Planner** | `src/lib/csl/lucky-engine.ts` → `/study/lucky` | Builds multi-phase StudySession from counts (missed, flashcards, weak topics). Links out; does **not** grade RetentionItems. |
| **Item review** | `src/lib/learning/retention/review.ts` + `LuckyRetentionReview.tsx` on `/study/lucky/session` | One RetentionItem at a time → submit → schedule + RETAIN evidence |

Preserved UX: one-at-a-time, score/schedule labels, **no answer dump** on submit.

## 2. Where retention candidates come from

1. Quiz miss → `MissedQuestion` → `syncMissedQuestionRetentionItem` (`bridges.ts`)
2. Due flashcards → `syncFlashcardRetentionItem` (SM-2 mirror)
3. Weak `ConceptMastery.retain` &lt; 0.45 + `reviewCount ≥ 1` → `syncWeakMasteryRetentionItem`
4. Lazy `syncRetentionSourcesForUser` on Lucky GET
5. Adaptive **COMPLETED** → `syncLuckyRetentionAfterSequenceComplete` → weak-mastery bridge only

**Not** from Orchestrator `RETENTION_GAP` / `RECALL_GAP` (those route to SIX active-recall).

## 3. How missed questions are handled

Create MissedQuestion (~+24h); bridge MISSED_QUESTION RetentionItem (priority ~0.85). Review reuses **same** prompt. FAIL → `nextReviewAtForOutcome` ≈ 12h. No variation / misconception branch.

## 4. How successful retention is recorded

`submitRetentionReview` → `recordRetentionOutcome` → best-effort `recordEvidence` / `applyEvidenceToMastery` (`skillFacet: "RETAIN"`, source `lucky_retention_review`). Correct ≠ permanent mastery (existing formulas unchanged).

## 5. How ConceptMastery affects retention

Retain facet drives WEAK_MASTERY upsert/complete (≥ 0.45 completes item). Adaptive handoff reads facets. Items without `conceptId` skip meaningful mastery (documented gap).

## 6. How RETENTION_GAP reaches LUCKY

**It does not enqueue Lucky items.** Diagnose → SIX `active-recall` + PRACTICE_CHECK. Lucky only if retain stays weak and other bridges fire (or Adaptive COMPLETE later).

## 7. Which activities provide RETAIN content

**Evidence:** flashcards, blurting/active-recall, Lucky submit.  
**Progression stage RETAIN:** sparse — Java inheritance, SQL filter, phishing, math linear (`experience-depth` / `content-depth`).

## 8. Which domains have RETAIN depth

| Depth | Domains |
|-------|---------|
| Deeper | Coding, SQL, cyber phishing, math linear |
| Shallow / missing RETAIN stage | Nursing, business, physics, chem, languages, automotive, networking (2P-36/37 companions often stop at APPLY/CHALLENGE) |

## 9. Where retention is repetitive / shallow

- Identical MissedQuestion forever
- WEAK_MASTERY = self-rate “How well can you recall…?”
- Coarse 12/24/72h spacing (not SM-2 for RetentionItem; flashcard SM-2 stays authoritative)
- No misconception-aware requeue
- No session candidate caps beyond query `take`

## 10. What’s missing for universal retention

1. Explicit **RetentionCandidate** contract + deterministic selection/caps
2. **Variation** on miss / weak recall (same concept, different context)
3. **Misconception-aware** retention prompts where signals exist
4. Learner-friendly **why this review** copy (not engine jargon)
5. More RETAIN progression for priority 2P-36/37 concepts
6. Optional soft bridge: when Orchestrator would flag retention need, ensure eligibility feeds existing bridges — without making Lucky a second Orchestrator

## 11. Safe additive changes

- `src/lib/learning/retention/candidates.ts` (+ types) on top of existing due query
- Variation resolver metadata in `resolveRetentionContent` / miss requeue
- `reasonLabel` on `RetentionReviewItemView` (friendly)
- RETAIN companions for priority concepts (structured challenges + progression)
- Tests + extend lucky-handoff E2E for review submit ≠ open evidence
- Soft-fail only; preserve unique `(userId, sourceType, sourceRef)`

## 12. Deferred

- Full FSRS/SM-2 for RetentionItem (keep coarse schedule)
- Orchestrator-fed Lucky planner rewrite
- Writers for unused `TUTOR_FLAG` / `MASTERY_DECAY` as product features
- Forcing RETAIN ladder for every concept
- Answer reveal / tutoring inside Lucky
- Collapsing Lucky into Adaptive
- Specialized speaking/CAS retention engines

---

## Architecture to preserve

```
LearningAttempt → Evidence → ConceptMastery → Orchestrator
Adaptive COMPLETED → syncLuckyRetentionAfterSequenceComplete → WEAK_MASTERY bridge
Lucky submit → RETAIN evidence → ConceptMastery
```

**Audit complete — implement only §11 gaps.**
