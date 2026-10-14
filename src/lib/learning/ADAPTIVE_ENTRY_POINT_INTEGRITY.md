# 2G-78 — Adaptive Entry-Point Integrity

## Principle

**Preserve → Connect → Upgrade → Extend**

Not every Study Haul click goes through Adaptive. Actions that mean “help me learn” use the ULE; actions that open known tools stay direct.

## Entry kinds

| Kind | Meaning |
|------|---------|
| `ADAPTIVE_LEARNING` | Enter/resume the Adaptive closed loop via canonical start |
| `DIRECT_ACTIVITY` | Open a known technique/activity/tool without creating Adaptive state |
| `CONTENT_MANAGEMENT` | Browse, plan, or manage — not instruction |

Helper: `src/lib/learning/entry-point.ts`

## Canonical Adaptive start

All Adaptive Learning Entries converge on:

**`POST /api/study/adaptive/start`**
→ `startOrResumeAdaptiveSequenceForConcept`
→ `startAdaptiveSequenceRun` (coordinator)

Server selects authenticated learner. Client `userId` / `learnerId` are ignored.

Resume uses `/study/adaptive/{runId}` when an ACTIVE run already exists.

## Surface inventory

### Adaptive Learning Entry

| Surface | Path |
|---------|------|
| Hub Orchestrator primary CTA | `POST /api/study/adaptive/start` |
| CORE Continue learning | same |
| Study Now Continue learning (when `Topic.conceptId`) | same |
| Adaptive run shell | resume / in-run activity with `adaptiveRunId` |
| Assessment workflow (explicit ASSESS) | Assessment handoff (not generic activity open) |

### Direct Activity Access (preserved)

| Surface | Notes |
|---------|-------|
| Hub secondary “Try it” SIX | Direct SIX deep link |
| Hub `activityIntervention` Open | Optional practice **without** Adaptive run — intentional |
| AssignmentsTab “Practice activities” | Catalog shortcut to `/study/activities/coding` — **not** concept Adaptive |
| `/study/six/[component]` | Direct SIX techniques |
| Known Quiz / QuizTaker | Direct; Adaptive Quiz only via quiz adapter |
| Flashcard review | Direct; Adaptive Flashcard via adapter |
| `/study/activities/[kind]` standalone | Direct unless Adaptive query params |
| Locker study tools | Direct tool open |

### Content / Management (preserved)

| Surface | Notes |
|---------|-------|
| Assignments list / planner | Due work management |
| AssignmentsTab learner-model link | Progress visibility |
| Study Hub nav / Study Now planning | Planner intact |
| LUCKY / retention UI | Downstream retention — not Adaptive start |
| CORE notes/editing | Independent document environment |

## Title-only activity selection

Compatibility may use concept **title/topic cues** only when `subjectDomain` is absent (strength 1). That is selection metadata inside Orchestrator policy — **not** an Adaptive entry-point bypass and **not** invented Concepts from UI labels.

With authoritative `subjectDomain`, token/phrase matching (2G-77) applies. Insufficient context → no activityIntervention → SIX.

## Learning Intent

Intent is soft. Navigation does not invent ASSESS/PRACTICE. Explicit ASSESS → Assessment workflow. Opening a saved Quiz does not invent ASSESS.

## Lucky terminal handoff

```
completeAdaptiveSequence (ACTIVE → COMPLETED)
→ syncLuckyRetentionAfterSequenceComplete
→ syncWeakMasteryRetentionItem
```

Exactly once per successful complete. Abandon / plan-next stops / incomplete do **not** hand off. No second retention writer.

## Browser E2E

Playwright harness added in **2P-24** (`playwright.config.ts`, `e2e/`, `npm run test:e2e`).  
See `BROWSER_E2E_LEARNER_JOURNEY.md`. Cypress is not used.

## Architecture invariants

ONE: ULE · Learner Model · Knowledge Model · Evidence · Mastery · Orchestrator · Tutor · Adaptive Sequence · Retention

**CORE → SIX → LUCKY**

Activity lifecycle: Diagnosis → Capability → Compatibility → Availability → Ranking → Activity → Evidence → Mastery → Re-orchestrate
