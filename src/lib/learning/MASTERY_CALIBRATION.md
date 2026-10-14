# MASTERY_CALIBRATION — 2P-44

**This phase calibrates evidence sufficiency. It does not introduce mastery decay.**

**Not:** second mastery engine · scoring engine · MasteryPlanner · GrowthEngine · decay algorithm

---

## Evidence sufficiency model

`classifyEvidenceSufficiency` (read-side):

| Level | Meaning (aligned with Orchestrator confidence) |
|-------|--------------------------------------------------|
| `none` | No reviews / events |
| `thin` | Single-review / single-source early evidence |
| `emerging` | ≥2 reviews **or** ≥2 events **or** ≥2 source kinds |
| `adequate` | ≥3 reviews **and** (≥2 kinds **or** ≥4 events) |
| `rich` | ≥5 reviews **and** (≥3 kinds **or** ≥6 events) |

Authority remains `LearningAttempt` → `ConceptMastery`. Sufficiency does **not** write mastery.

---

## Facet-aware evidence

Facets stay distinct (RECOGNIZE / EXPLAIN / APPLY / SOLVE / PERFORM / RETAIN).  
`calibrateFacetStatus`: thin evidence cannot claim `demonstrated` → `developing`.

---

## Evidence quality

Unchanged write path: open / hint / checkStep / diagnostic / view ≠ evidence.  
Submit / evaluate / retention response → `recordEvidence`.  
Score still unused in `applyFacetDelta` this phase (deferred weighting).

---

## Repeated attempts

Legitimate retries remain valid. Optional activity idempotency keys and Adaptive attemptId bind prevent accidental duplicates. No ban on repeated practice.

---

## Conflicting evidence

`interpretConflictingEvidence` reads existing aggregation signals (streaks, recent fail/success). Soft learner-safe lines only — no statistical rewrite of ConceptMastery.

---

## Recency

Uses 2P-43 recent vs historical continuity. **No mastery decay.**

---

## Misconceptions

Signals remain on LearningAttempt + aggregation hints. SUCCESS does not auto-clear misconception aggregates. No domain-specific misconception engine.

---

## Orchestrator

`calibrateOrchestratorDiagnosis`:
- Thin/emerging cannot claim `NO_INTERVENTION` → soft `INSUFFICIENT_EVIDENCE`
- Thin gap diagnoses keep the gap but append a cautious reason
- No new diagnosis enums

---

## Growth Center

Presentation uses calibrated facet status. Snapshot copy avoids permanent-mastery language.

---

## Adaptive / LUCKY

Unchanged loops. Adaptive still diagnosis → intervention → evidence. LUCKY remains ConceptMastery → RetentionItem.

---

## Deferred

- Mastery decay  
- Score-weighted `applyFacetDelta`  
- Producer-wide anti-inflation beyond existing idempotency  
