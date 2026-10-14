# UNIVERSAL_LEARNING_EXPERIENCE_AUDIT — 2P-33

**Status:** Complete before code changes  
**Scope:** Product experience unification only — not a new ULE architecture

Builds on 2P-25 experience contracts. ULE spine remains: CORE → SIX → Adaptive → Evidence → Mastery → Orchestrator → Learner Model → LUCKY.

---

## A. Existing experience

| Surface | Role |
|---------|------|
| Study Hub | Home / choose what to work on |
| CORE | Capture, organize, understand material |
| SIX | Learning techniques / interventions |
| Unified Tutor | Conversational teaching |
| Adaptive | Personalized next-step progression |
| Universal Activity | Perform the learning task |
| Growth Center | Progress / demonstrated mastery |
| LUCKY | Retention after progression |
| Materials | Source / context |
| Course / LMS / Assignment | Optional academic context |

Contracts already exist: `LearningAction`, `ContinueLearningButton`, `AdaptiveReturnStrip`, `LearnerContextStrip`, activity lifecycle states, hub/core/growth Adaptive bridges.

---

## B. Existing navigation

Canonical Adaptive entry: `POST /api/study/adaptive/start` → `/study/adaptive/{runId}`.

Hub → Adaptive (OrchestratorSuggestionCard). Growth → Adaptive (ContinueLearningButton + activeRunId). CORE → Adaptive (bridge + fromNote). Materials → Adaptive (local handler, always “Start”). Assignments → Adaptive (“Study this”). Study Now → Adaptive (Practice · topic override). Activity/Quiz/Flashcards → Adaptive via AdaptiveReturnStrip. Adaptive COMPLETED → Lucky soft handoff. SIX Adaptive-bound → router push Adaptive.

---

## C. Existing actions

`learning-action.ts`: Start learning / Continue learning. Used well on Hub, Growth, CORE labels. Materials hardcodes Start. Assignments override “Study this”. Study Now overrides “Practice · …”. Multiple parallel Adaptive-start clients (Hub card, ContinueLearningButton, CORE, Materials).

---

## D. Existing state handling

`data-activity-state` on ActivityWorkspace only. Adaptive `data-adaptive-status`. Growth CTA kinds. Mastery presenters use soft learner copy (not fake “Mastered”). Quiz/Flashcards/SIX lack universal activity-state announcement.

---

## E. Existing context presentation

LearnerContextStrip on Adaptive, Activity, Growth. Hub context often empty (no concept props). Material citation on Adaptive + ActivityWorkspace. Missing strips on Quiz/Flashcards/SIX/Lucky/Teach Me when Adaptive-bound.

---

## F. Existing return paths

AdaptiveReturnStrip shared for Activity + Quiz + Flashcards. Adaptive shell → Hub / Lucky / CORE notebook. SIX → Adaptive push without Growth/Hub secondary links like the strip. Lucky lacks return-to-Adaptive when entered from Adaptive handoff.

---

## G. Accessibility / responsive

Strong on Hub Adaptive CTA, return strip, Adaptive shell (`min-h-11`, focus-visible). Material learning CTAs weaker (`text-xs` / `py-1.5`). Quiz/Flashcards/SIX miss activity-state live regions.

---

## H. Terminology

| Issue | Severity |
|-------|----------|
| Materials always “Start learning” | Medium |
| Assignment “Study this” hides Start/Continue | Medium |
| Study Now section always “Continue learning” | Medium |
| Growth “concept mastery” jargon | Low–Medium |
| Orchestrator not in visible Hub eyebrow | OK |
| Brand CSL vs Study Haul | Low |

---

## I. Duplicated UI logic

Four Adaptive entry handlers. Empty/fallback link clusters duplicated (Hub / Growth / Adaptive abandoned). Return presentation already partly deduped (2P-25 strip).

---

## J. Intentional differences (DO NOT unify)

- Orchestrator suggestion vs SIX TopicMastery tips  
- Study Now / Lucky planners vs Adaptive closed loop  
- Direct Quiz/Flashcards/SIX vs Adaptive-bound  
- CORE Assist vs Teach Me vs SIX Tutor (same `runTutor`, different jobs)  
- Topic progress vs Concept mastery presenters  
- Activity kind UIs remain specialized  

---

## K. Safe additive improvements

1. Materials → shared Start/Continue resolver (+ activeRunId when known)  
2. Assignments: canonical Start/Continue label; keep “Study this” as secondary/context  
3. Study Now: clarify Start vs Continue vs Practice · topic  
4. Optional LearnerContextStrip on Quiz/Flashcards/SIX when Adaptive-bound  
5. SIX Adaptive return: Growth/Hub links alongside existing return  
6. Material CTA touch targets  
7. Soften Growth mastery jargon  
8. Hub context: pass focus concept when Orchestrator suggestion present  
9. Document return-path matrix + journey roles  

---

## L. Out of scope

Second engines of any kind; replacing CORE/SIX/LUCKY; collapsing Study Now into Adaptive-only; evidence from navigation; PERFORM_GAP; wholesale redesign; removing existing tools/buttons.

**Audit complete — proceed with CONNECT + POLISH only.**
