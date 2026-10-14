# UNIVERSAL_CONTENT_DEPTH_AUDIT — 2P-32

**Status:** Complete before architecture changes  
**Scope:** Audit only — no second catalog, no domain engines

---

## 1. Current content architecture

```text
Content packs (domain-expansion, edu-market, writing)
  → activity catalogs (coding / sql / structured)
  → CONTENT_PROGRESSION_CATALOG (stages, difficulty, contextVariant)
  → content-contract descriptors
  → experience projection + scaffolding
  → Adaptive bind (activity-adaptive-completion)
  → Orchestrator / Evidence / ConceptMastery (unchanged)
```

Inspection layer: `content-production/*` (integrity, density, seeds, AI candidate).  
Pipeline: `content-pipeline/*` (prepare/validate; AI never writes evidence).

**Preserve:** one ULE, one Knowledge Model, one Learner Model, one ConceptMastery, one Orchestrator, one Adaptive engine, one Universal Activity contract.

---

## 2. Content row structure

| Layer | Identity | Key fields |
|-------|----------|------------|
| Coding / SQL challenge | `id` | objective, prompt, starter, evaluation artifacts, optional enrichment |
| Structured challenge | `id` + `kind` | objective, prompt, criteria[], minChars, scaffolds, enrichment |
| Progression entry | `contentKey` | conceptKey, stage, difficulty 1–5, contextVariant, activityKind, contentId, readiness |
| Descriptor | kind + contentId | objective, task, evaluationMode, domainContext, conceptHints |

Enrichment (`ContentEnrichmentFields`): `misconceptionTargets?`, `accessibility?`.

---

## 3. Concept mapping

Progression `conceptKey` + challenge `conceptHints` → content-contract selection → Adaptive/Orchestrator conceptId when journey-bound.

Orphan risk: catalog rows without progression or weak hints. Seed registry (~35) proves Adaptive-ready pairing. Generic intro coding (`js-sum-two`) is intentionally skill-warmup — document as non-ladder content.

---

## 4. Domain mapping

Free-form `domainTag` / `domainContext` (not subject engines): CS, networking, cybersecurity, nursing, business/finance, math/science, electrical, automotive, history, english/writing.

---

## 5. Activity mapping

| Kind | Catalog source | Adaptive-ready (mechanism) |
|------|----------------|----------------------------|
| coding | `coding/challenges.ts` | yes |
| sql | `sql/challenges.ts` | yes |
| lab/sim/writing/presentation/game/project | structured + packs | yes (2P-18/30) |
| quiz / flashcard | dedicated adapters | dedicated lanes |
| six | intervention catalog | SIX — not generated content |

---

## 6. Progression

Stages (existing only): INTRODUCE → UNDERSTAND → PRACTICE → APPLY → CHALLENGE → RETAIN.

Selector: `selectProgressionContent` (stage prefs, difficulty, excludeContentKeys, avoidContextVariant). Not Orchestrator.

Gap: some ladders reuse the same `contentId` across APPLY/CHALLENGE (title/stage differ; task identical) — weak depth.

---

## 7. Difficulty

`ContentDifficulty` 1–5 on progression entries. Not forced to equal stage ordinal. Mechanism: scaffolding level, transfer context, multi-step criteria, reduced hints.

---

## 8. Variation

`contextVariant` required on progression entries. Variation infrastructure exists (`avoidContextVariant`). Meaningful variants uneven — SQL JOIN has one dataset context; inheritance APPLY/CHALLENGE share one coding challenge.

---

## 9. Misconception handling

Soft authoring tags: `misconceptionTargets: string[]`. **Targets, not diagnoses.** Evidence / Learner Model / Orchestrator remain authoritative for learner state. Coverage ~half of catalog via get*.

---

## 10. Scaffolding

Kinds: HINT | STEP | EXAMPLE | CHECKLIST | CONSTRAINT. Removable via reveal policy / projection. Not all rows authored.

---

## 11. Success criteria

Structured: `criteria[]` + `minChars` + optional `successLooksLike`. Coding: tests / requiredPatterns. SQL: expectedRows. Integrity flags empty structured criteria.

Placeholder risk: vague `successLooksLike` strings — pipeline `isMeaningfulObjective` helps objectives; success strings need quality gate.

---

## 12. Rubrics

Universal `evaluateAgainstRubric` (`activities/rubric.ts`) — keyword `mustIncludeAny` heuristic. Document limitation: not proof of mastery alone; Adaptive evidence still goes through completion contracts.

Dimensions used ad hoc per criterion label (accuracy, procedure, safety, reasoning) — no second rubric engine.

---

## 13. Accessibility

`ContentAccessibilityMeta`: altDescription, reducedComplexity, extendedTimeSuggested, interactionNote. Sparse. Coexists with learner persona accessibility hooks — presentation, not diagnosis.

---

## 14. Material alignment

2P-27/28 source alignment optional; no CourseContent / LMSContentEngine. Same UA catalog serves curated, generated (validated), and material-linked learning.

---

## 15. Adaptive readiness

`assessAdaptiveReadyCatalogItem`: mechanism Adaptive-ready ∧ contract complete ∧ READY progression. Quality enrichment recommended, not required for flag. Orchestrator still decides interventions.

---

## 16. Catalog density (measured)

Approximate live inventory at audit time:

| Kind | ~Count |
|------|-------:|
| coding | 10 |
| sql | 6 |
| structured (lab/sim/writing/pres/game/project) | ~67 |
| progression entries | ~92 |
| concepts (unique keys) | ~65 |

Density = concept × stage × activity × difficulty × variation — not raw row count.

**Stale report bug:** `buildContentDensityMatrix` marked Cybersecurity as NONE despite live phishing/password/firewall content.

---

## 17. Content gaps (2P-32 priorities)

| Priority | Gap |
|----------|-----|
| P0 | Quality contract (required / optional / N/A); placeholder rejection in integrity |
| P0 | Honest density matrix (cyber + business families) |
| P1 | Distinct CHALLENGE/APPLY contentIds for representative ladders (inheritance, SQL JOIN) |
| P1 | Actionable misconceptions + removable scaffolds on thin enriched rows |
| P1 | Cyber / electrical / automotive stage depth |
| P2 | Retention progression rows (retrieval, not re-explain) |
| P3 | Mass catalog expansion — **out of scope** |

---

## STOP conditions (confirmed)

- No domain content engines  
- Misconception tags ≠ learner diagnosis  
- AI candidates ≠ evidence until validated  
- No second progression / rubric / accessibility system  
- Do not mass-generate shallow rows to inflate density  

**Audit complete — proceed to quality contract + additive depth.**
