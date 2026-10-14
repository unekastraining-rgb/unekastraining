# Universal Experience Audit (2P-25)

Product unification audit — **no architecture rewrite**. Findings from Hub, Growth Center, Adaptive, Activity Workspace, CORE, SIX, Tutor, Quiz, Flashcards, LUCKY, Study Now, and related CTAs.

## 1. Where does the learner start?

| Entry | Route / surface | Role |
| --- | --- | --- |
| **Study Hub** (canonical home) | `/study` → `study-hub-view.tsx` | “Where should I learn next?” |
| Growth Center | `/study/learner-model` | Informational + Start/Continue continuity |
| CORE knowledge bridge | `/core` + `CoreKnowledgeBridgePanel` | Notes → Adaptive CTA when concept grounded |
| Study Now | Hub `#study-now` / session runner | Time-boxed planner; optional ULE bridge |
| Direct SIX / Quiz / Flashcards / Practice | Various | Direct activity; Adaptive only when `adaptiveRunId` present |

**Canonical start for personalized learning:** Orchestrator Hub CTA → `POST /api/study/adaptive/start` → `/study/adaptive/{runId}`.

## 2. Where does the learner understand what to do?

- Hub: `OrchestratorSuggestionCard` (“What to do next”)
- Growth: same card + section explanations
- Adaptive shell: “Why this step?” via `buildAdaptiveLearnerStateVisibility`
- Activity: `LearningExperienceView` (objective / why / expected action)

## 3. Where does the learner perform the activity?

- **Activity Workspace** (`/study/activities/[kind]`) — Coding, SQL, Lab, Simulation, Writing, Presentation, …
- SIX guided sessions, Quiz taker, Flashcards review, Teach Me / Tutor
- Adaptive shell launches bound hrefs; does not embed activity logic

## 4. Where does the learner see progress?

- Growth Center (ConceptMastery presenter + recent evidence timeline)
- Hub mastery summary on Orchestrator card
- Adaptive learner-state strip
- Activity completion result (outcome only — not a second mastery writer)

## 5. Where does the learner continue?

- Adaptive return strip (`data-adaptive-return`) after bind
- Adaptive Complete → Lucky handoff when legal
- Growth / Hub Start–Continue CTAs
- CORE `fromNote` round-trip

## 6. Duplicate or disconnected workflows

| Issue | Severity | Notes |
| --- | --- | --- |
| Three copy-pasted Adaptive start handlers (Hub / Growth button / CORE) | Medium | Same API; presentation duplication |
| Label split: Hub “Start/Resume adaptive study” vs Growth “Start/Continue learning” vs CORE “Continue learning” for fresh start | High (UX) | One semantic action, three labels |
| Study Now / CORE often omit `activeRunId` client-side | Low | Server still resumes ACTIVE run |
| Topic-progress Six panel vs Orchestrator | Intentional | Different mastery source — do not merge |
| Study Now planner vs Adaptive | Intentional | Classified as management / direct in `entry-point.ts` |

## 7. Canonical surfaces

- Study Hub, Orchestrator suggestion, Adaptive run shell, Activity Workspace, Growth Center, Unified Tutor (Teach Me / SIX tutor), LUCKY retention, CORE authoring + bridge

## 8. Legacy / secondary

- Study Loop Strip (TopicMastery Core→Six→Lucky shortcuts)
- SixRecommendationsPanel (topic progress)
- MasteryTree (TopicMastery)
- `/study/practice` coding shortcut
- Grade-school parallel plan
- LearnerModelPanel alias → Growth Center

## 9. Surfaces that compete with Adaptive?

**No second Adaptive engine.** Competing *narratives* only:

1. Adaptive closed loop (canonical personalized path)
2. Direct SIX / activity / quiz / flashcard
3. Study Now / Lucky planners
4. Topic-progress Six tips

Hub tests enforce Adaptive primary CTA before “Try it”.

## Shared contracts to extend (presentation only)

- `resolveHubAdaptivePrimaryCta` (`hub-adaptive-bridge.ts`)
- Growth / Core label wrappers
- `LearningExperienceView`
- `buildAdaptiveLearnerStateVisibility`
- `HUB_ORCHESTRATOR_EMPTY_COPY`
- Adaptive return strip pattern (Activity / Quiz / Flashcards)

## Smallest safe unification (this phase)

1. Universal **LearningAction** presentation contract (no evidence/mastery/recommend)
2. Align **Start learning** / **Continue learning** labels across Hub, Growth, CORE
3. Shared Adaptive return / completion presentation helpers
4. Universal activity **state** semantics (data attributes)
5. Scrub learner-visible “Orchestrator” wording
6. Document journey + activity lifecycle; extend tests + soft E2E checks

## Stop conditions checked

- Single evidence spine / ConceptMastery / Orchestrator / Adaptive — preserved
- No subject-specific engines discovered that require redesign
- Topic vs Concept dual presenters are intentional — document, do not merge
