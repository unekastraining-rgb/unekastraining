# MASTERY_CALIBRATION_AUDIT — 2P-44

**Mode:** Enhance evidence sufficiency / presentation calibration — no second mastery engine  
**Rule:** LearningAttempt authoritative · ConceptMastery canonical · no mastery decay  
**Prior:** 2P-43 longitudinal continuity · evidence aggregation policy · Orchestrator bands

---

## What already exists

| Concern | Existing |
|---------|----------|
| Evidence write | `recordEvidence` only (submit/evaluate paths) |
| Mastery write | `applyEvidenceToMastery` · facet deltas +0.1/−0.06 |
| Facet bands | WEAK 0.45 · STRONG 0.55 |
| Intelligence | `aggregateEvidenceSignals` (streaks, misconceptions) — hints only |
| Orchestrator | Hard INSUFFICIENT when empty; gaps after ≥1 review |
| Confidence | HIGH when reviewCount≥3 + diversity |
| Growth | Facet status labels; 2P-43 recent/historical |
| Idempotency | Optional activity key; Adaptive attemptId bind |

## Explicit answers

1. **Meaningful evidence** — server-evaluated submission with envelope (not open/hint/view)  
2. **Attempts before strong** — ~6 SUCCESS → STRONG band; no N-gate on “demonstrated”  
3. **Quality** — outcome + misconceptions for hints; score unused in mastery math  
4. **Facets** — distinct (retain spill only cross-facet)  
5. **Inflation** — possible without idempotency key  
6. **Single score overpower** — score ignored; one SUCCESS ≠ wipe streak  
7. **Single FAIL collapse** — soft (−0.06); not empty  
8. **Orchestrator insufficient** — yes for empty/ambiguous; weak for thin evidence gaps  
9. **ConceptMastery accuracy** — EWMA-like facets; not calibrated sufficiency  
10. **Growth overclaim** — risk when score≥0.55 with thin N  

## Genuine gaps

1. No sufficiency gate before “demonstrated” / hard gaps  
2. Thin evidence can still claim APPLICATION_GAP etc.  
3. Growth “demonstrated” ignores reviewCount/source diversity  

## Smallest additive plan

1. `evidence/evidence-sufficiency.ts` — NONE | THIN | EMERGING | ADEQUATE | RICH  
2. `mastery/mastery-calibration.ts` — downgrade demonstrated claims when THIN  
3. Soft Orchestrator: prefer INSUFFICIENT / LOW when THIN (no new diagnosis enums)  
4. Growth wording via calibrated progress  

**No mastery decay · no second engine · no score rewrite in applyFacetDelta (this phase).**
