# 2G-71 WS C — Coding Activity Product

**Status: PRODUCT-READY** (standalone evidence path)

## Lifecycle

Challenge → learner code → **server** evaluation → EvidenceEnvelope →  
LearningAttempt → ConceptMastery (PERFORM)

## Evaluation

- **JavaScript:** `node:vm` sandbox with timeout (no `require` / host shell)
- **Python / Java:** structural objective criteria (language abstraction ready; no host execution)

## Surfaces

- API: `GET/POST /api/study/activities/coding`
- UI: `/study/activities/coding?conceptId=…`
- Adaptive: optional completion bind when `adaptiveRunId` provided (not an Orchestrator intervention)

## Security

Forged outcome/score/learnerId stripped. Concept ownership enforced. Client SUCCESS ignored.

## Maturity notes

| Dimension | Status |
|-----------|--------|
| Learner interaction | Yes |
| Server evaluation | Yes |
| Evidence → ConceptMastery | Yes |
| Adaptive step in run shell | PARTIAL (bind only) |
| Assessment adapter | Opt-in helper (`coding`) |

Existing `/study/practice` + `code-evaluate` TopicMastery path **preserved** (not replaced).
