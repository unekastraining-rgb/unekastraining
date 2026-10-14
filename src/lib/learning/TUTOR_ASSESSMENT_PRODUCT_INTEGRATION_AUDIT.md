# 2G-70 WS4 — Tutor / Assessment Product Integration Audit

**Status:** AUDIT — 2G-67 preserved; no rebuild

## Tutor path

Tutor → Learning Intent (metadata) → server evidence authorization →  
LearningAttempt → ConceptMastery

### Confirmed

- Client `evidenceIntent` cannot mint evidence (`evidenceAuthorizedByServer`)
- Authenticated learner identity authoritative
- Concept ownership authoritative
- Outcome/score server-authoritative on write path
- Ordinary Q&A non-evidence
- Tutor modes + Learning Intent preserved

## Assessment path

ASSESS → Assessment Workflow → Assessment Adapter → Activity →  
Evidence → LearningAttempt → ConceptMastery

### Confirmed

- **ASSESS ≠ Quiz** — no default Quiz without `adapterKey: "quiz"`
- Quiz bridge and Flashcard bridge remain activity-owned evidence writers
- Assessment adapters do not write evidence themselves

## Remaining gaps (deferred)

- Tutor LearningAttempt idempotency on retry (P1)
- Demonstration facade underused by product UI
- Hub does not yet consume `assessmentHandoff` for standalone ASSESS

**Implementation this workstream:** audit only.
