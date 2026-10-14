# 2P-3 — Study Hub as the Learner Home (ULE-centered productization)

**Mode:** Audit + small additive Hub UX. No second decision engine.  
**Predecessors:** 2P-1 real learner flow · 2P-2 CORE reliability · 2G-59/63/78 Hub Adaptive.

---

## Executive Summary

The Study Hub (`/study` → `StudyHubView`) is a **presentation/entry surface**. Adaptive decisions still come only from the existing Orchestrator via `GET /api/study/orchestrator-suggestion` and `POST /api/study/adaptive/start`.

**2P-3 product gaps fixed:**

1. Silent empty Orchestrator card (`return null`) → soft empty with CORE / Study Now / Learner Model fallbacks (no fabricated recommendation).
2. Ambiguous “Current learning state” → **Concept mastery:** labels + Hub eyebrow.
3. Topic Six tips `%` badge → labeled **Topic progress**.
4. Loading flicker → keep prior suggestion while refetching.
5. Adaptive start failure → keep card + explicit “direct access still works” copy.
6. Hierarchy: “What to do next” section opens by default; Learner Model / CORE / Lucky / Quiz / Flashcard links reinforced under “More ways to study”.

---

## Hub's role

Answer for the learner:

1. What am I learning? → course/topic + Orchestrator concept notice  
2. What should I do now? → Adaptive primary CTA  
3. Why? → Orchestrator reason  
4. How am I progressing? → Concept mastery summary (ULE) vs Topic progress (legacy)  
5. What can I access directly? → Six / Lucky / Quiz / Flashcards / CORE / Assignments (adjacent)  
6. Where for something specific? → More ways + Learner model  

Hub does **not** diagnose, invent mastery, or write evidence.

---

## Current entry points

| Entry | Surface | Path |
|-------|---------|------|
| Study Hub home | `/study` | `StudyHubView` |
| Dashboard home | `/dashboard` | `AcademicHub` / `HubDashboardTab` |
| Adaptive CTA | Orchestrator card | start/resume |
| Study Now | Hub primary | `/api/study-now` planner |
| CORE → Adaptive | Studio bridge | preserved (2P-2) |
| Direct SIX/Lucky/Quiz/FC | Hub grids + secondary links | preserved |

---

## Primary CTA

`resolveHubAdaptivePrimaryCta` → Resume (nav) or Start (`POST /api/study/adaptive/start` with `{ conceptId }` only).  
No second start route. Server `startOrResumeAdaptiveSequenceForConcept` remains authoritative.

---

## Orchestrator presentation

Hub fetches suggestion only. Diagnosis/mastery/intervention remain server-side.  
Card hierarchy: **What to do now** → notice / recommendation → Concept mastery → Why this step → Adaptive CTA + optional Try it / activity Open.

---

## Mastery presentation

| Display | Source | Label |
|---------|--------|-------|
| Orchestrator `masterySummary` | ConceptMastery | `Concept mastery: …` |
| Orchestrator `conceptProgress` | ConceptMastery | Concept progress headlines |
| SixRecommendationsPanel badge | TopicMastery | `Topic progress N%` |
| Study Now focus line | Topic proficiency | `Topic progress focus:` |
| Assignments insights | TopicMastery | Topic progress (unchanged) |

TopicMastery is **not** merged into ConceptMastery.

---

## Empty / loading / error states

| State | Behavior |
|-------|----------|
| No suggestion | Soft empty + CORE / Study Now / Learner model links |
| First load | Spinner “Looking for a gentle next step…” |
| Refetch | Prior suggestion kept (`aria-busy`) |
| Start failure | Error + fallback copy; SIX Try it / Hub remain |
| NO_INTERVENTION | Still no fabricated recommendation |

---

## Relationships preserved

- **Study Now** — planner; Continue Learning → Adaptive when conceptId exists  
- **Assignments** — direct practice; not forced through Adaptive  
- **CORE** — knowledge workspace + Continue Learning bridge  
- **SIX** — direct techniques + Try it secondary  
- **LUCKY** — retention grid + loop strip  
- **Learner Model** — `/study/learner-model` linked from Hub  

---

## Data ownership

Hub is read/presentation oriented. Mutations only via existing Adaptive start/resume entry. No LearningAttempt / ConceptMastery writes from Hub components.

---

## Hub surface table

| Hub Surface | Data Source | Mutation? | ULE Role | Status |
|-------------|-------------|-----------|----------|--------|
| OrchestratorSuggestionCard | Orchestrator present + ConceptMastery | Start/resume only | Entry | **PASS** |
| Adaptive primary CTA | hub-adaptive-bridge | POST start / nav resume | Adaptive entry | **PASS** |
| Soft empty state | Presentation copy | No | Safe empty | **PASS** |
| SixRecommendationsPanel | TopicMastery / weak topics | No | Direct SIX tips | **PASS WITH NOTES** |
| Study Now | Study Now planner API | Session save | Planning | **PASS** |
| StudyLoopStrip | Links | No | CORE→SIX→LUCKY | **PASS** |
| SIX/Lucky grids | Catalog | No | Direct access | **PASS** |
| Learner model link | Route | No | Deeper ULE view | **PASS** |
| Assignments (dashboard) | Assignments | Completion | Direct | **PASS** |
| Dashboard Topic progress pill | TopicMastery | No | Legacy | **LEGACY** |

---

## Fixes made

| File | Fix |
|------|-----|
| `OrchestratorSuggestionCard.tsx` | Empty state, keep-while-load, What now / Why, start-error fallback, Concept mastery eyebrow |
| `hub-empty-copy.ts` | Shared empty/fallback copy |
| `present-mastery-summary.ts` | `Concept mastery:` labels |
| `adaptive-learner-state.ts` | Align insufficient label |
| `AdaptiveSequenceRunShell.tsx` | Strip both label prefixes |
| `study-hub-view.tsx` | What to do next (default open), Learner model + direct links, `#study-now` |
| `SixRecommendationsPanel.tsx` | Topic progress badge label |

---

## Deferred improvements

1. Dedicated Hub loading skeleton for Study Now / assignments on dashboard (separate surface).  
2. Persist collapsible open state across sessions.  
3. Multi-concept suggestion picker (Orchestrator still returns top one).  
4. Mobile-only denser Adaptive CTA placement above fold when many courses.  
5. Unify dashboard “Mastery” telemetry chip naming (locker) — out of Study Hub scope.

---

## Test coverage

`src/lib/learning/study-hub-productization.integrity.test.ts` — TEST A–K + hierarchy.

---

## Verification

| Check | Result |
|-------|--------|
| Focused 2P-3 + related (5 files) | **55 passed** |
| `src/lib/learning` full suite | **112 files / 1187 tests passed** |
| ESLint (OrchestratorSuggestionCard, hub-empty-copy, present-mastery-summary, Six panel, adaptive-learner-state, AdaptiveSequenceRunShell, integrity test) | **clean** |
| ESLint `study-hub-view.tsx` | **1 pre-existing** `set-state-in-effect` on courseId sync |
| `tsc --noEmit` | **3 pre-existing** baseline errors; **0 new** |
| New failures from 2P-3 | **none** |
---

## Architecture confirmation

- Hub is a presentation/entry surface  
- Orchestrator remains the decision engine  
- ConceptMastery remains ULE mastery truth  
- TopicMastery remains legacy/curriculum progress  
- Hub writes no LearningAttempt / ConceptMastery  
- One Adaptive start path  
- CORE → SIX → LUCKY preserved  
- Direct activity access preserved  
- Study Now + Assignments intact  
- No second recommendation engine / Learner Model / Orchestrator  
