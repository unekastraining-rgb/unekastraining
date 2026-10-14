# UNIVERSAL_CONTENT_DEPTH — 2P-32

Universal content quality depth on the existing catalog spine.  
**Not** a second CMS, progression engine, rubric engine, or domain content engine.

---

## Content quality contract

Every Adaptive-capable activity should have fields where applicable:

| Field | Default (Adaptive) | Notes |
|-------|--------------------|-------|
| Concept | required | progression `conceptKey` and/or `conceptHints` |
| Activity | required | kind + contentId |
| Purpose | required | meaningful objective |
| Stage | required* | progression stage when Adaptive-selected |
| Difficulty | required* | 1–5 cognitive/task difficulty |
| Prompt | required | learner task |
| Expected learning outcome | required | may share specific objective |
| Success criteria | required | tests / expectedRows / rubric criteria |
| Misconceptions | optional | actionable targets only |
| Scaffolding | optional | removable HINT/STEP/… |
| Variation | optional | `contextVariant` / alternate contentIds |
| Accessibility | optional | `ContentAccessibilityMeta` |
| Source alignment | optional | 2P-27/28 — not CourseContent |
| Evaluation | required | descriptor evaluationMode |

\* Stage/difficulty live on progression entries. Standalone product launches may treat them N/A.

APIs: `contentQualityFieldContract`, `contentQualityApplicabilityForKind`, `validateContentQualityItem`.

---

## Content ≠ Activity

Content = what the learner works with.  
Activity = what the learner does.  
Same concept may power multiple activity kinds without duplicating explanatory content.

---

## Concept alignment

```text
Content → Concept → Learning activity → Evidence → ConceptMastery
```

Orphan Adaptive content without a defensible concept relationship is rejected under `requireAdaptiveDepth`. Intentionally generic warmups (e.g. `js-sum-two`) may lack a deep ladder — document as skill warmups.

---

## Stages

Existing only: INTRODUCE → UNDERSTAND → PRACTICE → APPLY → CHALLENGE → RETAIN.

Example ladder (Java inheritance): identify → explain → guided subclass → vehicle transfer → polymorphism challenge → delayed retrieval.

---

## Difficulty

1–5 on progression. **Not** auto-mapped from stage. Mechanisms: fewer hints, transfer context, multi-step criteria, ambiguity, reduced scaffolding.

---

## Misconceptions

Soft `misconceptionTargets` tags. Examples:

- Java: “Subclass automatically inherits private fields directly.”
- SQL: “Filtering aggregates with WHERE instead of HAVING.”
- Supply/demand: “Claiming a price ceiling above equilibrium creates a shortage.”

```text
Observed misconception signal → Evidence → Learner Model → Orchestrator
```

A content tag alone does **not** declare the learner has misconception X.

---

## Scaffolding

Reuse HINT | STEP | EXAMPLE | CHECKLIST | CONSTRAINT. Removable. Challenge/Retain rows intentionally lean.

---

## Success criteria & rubrics

Activity-specific via existing evaluators. Universal `evaluateAgainstRubric` uses keyword criteria — **heuristic**, not proof of mastery by itself. Evidence still flows through Adaptive completion contracts.

Reject placeholder `successLooksLike` such as “Complete the activity successfully.”

---

## Variation

`contextVariant` + `excludeContentKeys` / `avoidContextVariant`. Example: SQL JOIN students/enrollments vs customers/orders.

---

## Accessibility

`ContentAccessibilityMeta` on content; learner persona prefs for presentation. Content metadata does not change diagnosis.

---

## Material alignment & AI

2P-27/28 optional source alignment. AI may propose candidates; `validateAiContentCandidate` / pipeline must pass before publish. AI ≠ evidence.

---

## Validation & density

- `auditCatalogIntegrity` — duplicates, missing fields, placeholders, malformed scaffolds/misconceptions  
- `validateContentQualityItem` — Adaptive depth gate  
- `buildContentDepthDensityReport` — concept × stage × activity × difficulty × variation  
- `auditContentDepthSparsity` — soft flags; domains need not be identical  

---

## Domain depth (representative)

Depth pack `activities/content-depth` deepens CS, SQL, cybersecurity, nursing, business, writing, game, project — **quality over mass**.

Teaching Style remains HOW (Tutor). Content remains material.

---

## Adaptive / Orchestrator / SIX / LUCKY

Content metadata describes available interventions. Orchestrator decides from mastery + evidence + learner context. SIX remains the technique catalog. LUCKY remains retention scheduling. Quiz/Flashcard keep dedicated adapters.
