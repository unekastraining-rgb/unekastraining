# 2G-70 WS3 — CORE / Adaptive Product Integration Audit

**Status:** AUDIT — bridges already closed in 2G-68/69; no rebuild

## Verified path

CORE Knowledge confirm → owned Concept → Continue learning CTA →  
`POST /api/study/adaptive/start` → resume ACTIVE or start →  
Orchestrator diagnose → Adaptive progression → SIX/Quiz/Flashcard →  
evidence → LearningAttempt → ConceptMastery → re-orchestrate

## Confirmed

| Invariant | Status |
|-----------|--------|
| Active run resumes / no duplicate | Closed (`start-or-resume`) |
| No CORE evidence | Closed |
| No CORE ConceptMastery writes | Closed |
| Orchestrator = decision authority | Closed |
| Adaptive = progression authority | Closed |

## Remaining gaps (deferred — not blockers)

- CORE CTA rarely shows Resume label (server still resumes)
- No multi-concept picker on CORE
- `NO_INTERVENTION` → start 400 (no CORE-specific fallback)
- Soft Orchestrator copy not mirrored on CORE panel

## Files of record

- `core-adaptive-bridge.ts`, `CoreKnowledgeBridgePanel.tsx`
- `CORE_ORCHESTRATOR_CLOSED_LOOP_BRIDGE.md` (2G-68)
- Adaptive learner state (2G-69)

**Implementation this workstream:** none beyond audit (working behavior preserved).
