# 2G-71 WS B — Server-Authoritative Activity Evaluation

**Status:** IMPLEMENTED

## Boundary

Client may submit: learner work (code, SQL, drafts, choices, observations, artifacts).

Client may **not** authoritatively submit: SUCCESS/PARTIAL/FAIL, score, mastery, evidence, learner identity, concept ownership.

## Pipeline

`sanitizeClientActivitySubmission` → `assertOwnedConcept` → evaluator →  
`makeServerEvaluation` → `recordAuthoritativeActivityEvidence` →  
EvidenceEnvelope → LearningAttempt → ConceptMastery

## Tests

- Forged score/outcome/mastery/learner/concept rejected
- Valid evaluation works (coding service integration)

## Files

- `src/lib/learning/activities/server-evaluation.ts`
