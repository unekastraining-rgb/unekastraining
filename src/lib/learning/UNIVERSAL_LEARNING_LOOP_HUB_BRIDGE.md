# 2G-59 — Study Hub → Adaptive Closed-Loop Bridge

**Mode:** Additive product bridge. No Orchestrator / Adaptive / SIX / LUCKY redesign.

**Predecessor:** [2G-58 Universal Learning Loop Product Gap Audit](./UNIVERSAL_LEARNING_LOOP_PRODUCT_GAP_AUDIT.md) — P0 dual-CTA gap.

---

## 1. Existing Hub flow (before)

| Piece | Location | Behavior |
|-------|----------|----------|
| Display | `OrchestratorSuggestionCard` | Loads `GET /api/study/orchestrator-suggestion` |
| View model | `OrchestratorSuggestionView` | `conceptId`, `activeRunId`, `href`, `actionLabel`, … |
| Primary CTA | “Try it” `Link` | Direct SIX `suggestion.href` — **no Adaptive context** |
| Secondary CTA | Start/Resume adaptive | `POST /api/study/adaptive/start` → `/study/adaptive/[runId]` |

Problem: everyday learners clicked primary Try it and skipped the closed Adaptive loop (evidence without re-orchestration).

---

## 2. Changed Hub flow (after)

```text
Study Hub Recommendation
  → PRIMARY: Start / Resume Adaptive
  → /study/adaptive/[runId]
  → SIX (with Adaptive launch context)
  → LearningAttempt (activity writer)
  → ConceptMastery
  → Adaptive bind + re-orchestrate
  → Next step / stop
  → LUCKY handoff on COMPLETE (existing)
```

Secondary (optional): direct SIX link preserved for intentional manual use.

---

## 3. CTA hierarchy

| Priority | CTA | When |
|----------|-----|------|
| **PRIMARY** | Start adaptive study / Resume adaptive study | Usable `conceptId` (and/or `activeRunId`) |
| **SECONDARY** | Existing “Try it” (or actionLabel) → SIX href | When Adaptive primary is shown and href exists |
| **Fallback** | Direct SIX only | No usable `conceptId` / Adaptive unavailable |

Helpers: `src/lib/learning/orchestrator/hub-adaptive-bridge.ts`.

---

## 4. Active-run behavior

If `activeRunId` is present (from `getTopOrchestratorSuggestion` / ACTIVE runs):

- Primary label: **Resume adaptive study**
- Navigate to `/study/adaptive/[runId]` **without** calling start
- Do **not** create a second run

---

## 5. New-run behavior

If valid `conceptId` and no `activeRunId`:

- Primary label: **Start adaptive study**
- `POST /api/study/adaptive/start` with `{ conceptId }`
- On success → `/study/adaptive/[runId]` from response
- Start API already resumes if an ACTIVE run appears (server-side); Hub prefers client resume when `activeRunId` already known

---

## 6. Missing-concept behavior

- `resolveHubAdaptivePrimaryCta` → `{ kind: "none" }`
- No Adaptive start
- No fabricated conceptId
- Direct SIX remains if `href` + `actionLabel` exist (fallback primary styling)

---

## 7. Error behavior

- Start failure → recommendation remains; `role="alert"` error message
- No silent fallback to a competing progression path
- No evidence / mastery / diagnosis mutation from Hub
- `starting` flag blocks duplicate client start requests

---

## 8. Boundary between Hub and Adaptive

| Hub may | Hub must not |
|---------|----------------|
| Start/resume via existing API / route | Diagnose |
| Navigate to Adaptive run page | Choose next intervention |
| Show Orchestrator copy | Create LearningAttempt |
| | Update ConceptMastery |
| | Re-orchestrate |
| | Manage run state beyond entry |
| | Decide LUCKY |

---

## 9. Evidence ownership

**Hub creates ZERO LearningAttempts.**  
Evidence remains: SIX evaluate → `recordStudyEvaluateEvidence` → Attempt.

---

## 10. Mastery ownership

Unchanged: `applyEvidenceToMastery` from activity evidence only.

---

## 11. Orchestrator ownership

Unchanged diagnosis / intervention / SIX recommendation. Hub only routes into Adaptive.

---

## 12. LUCKY ownership

Unchanged. Adaptive COMPLETE → existing `syncLuckyRetentionAfterSequenceComplete`. Hub knows nothing about LUCKY.

---

## 13. SIX preservation

- Direct SIX secondary link preserved
- No technique relabel, evidence map, or completion-gate changes
- Adaptive SIX launch context remains the closed-loop path

---

## 14. Files changed

| File | Change |
|------|--------|
| `src/lib/learning/orchestrator/hub-adaptive-bridge.ts` | New pure CTA helpers |
| `src/lib/learning/orchestrator/hub-adaptive-bridge.test.ts` | Focused bridge tests |
| `src/components/study/OrchestratorSuggestionCard.tsx` | CTA hierarchy + resume/start |
| `src/lib/learning/UNIVERSAL_LEARNING_LOOP_HUB_BRIDGE.md` | This report |
| Related regression/design test expectations | Updated for new hierarchy |

---

## 15. Tests

See `hub-adaptive-bridge.test.ts` — resume/start/none, secondary SIX, card source contracts (start API, no evidence/mastery/re-orchestrate, duplicate-click guard).

---

## 16. Known blockers

Pre-existing `tsc` baseline (unrelated):

- `notebook-desk.ts`
- `generate-offline-fallback.integration.test.ts`
- `resolve-loop-focus-topic.ts`

---

*Phase 2G-59 — Study Hub → Adaptive Closed-Loop Bridge.*
