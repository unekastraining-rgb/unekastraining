# 2G-70 WS10 — Coding Activity Foundation

**Status:** FOUNDATION

## Architecture (target)

Coding Challenge → Activity → interaction → **server** objective evaluation →  
EvidenceEnvelope → LearningAttempt → ConceptMastery

## Shipped

Shared contracts in `src/lib/learning/activity-foundations.ts` (`codingActivityFoundation`).

## Explicitly not done

- No IDE
- Existing `/study/practice` + `code-evaluate` remains TopicMastery-only (not replaced)
- Client cannot claim SUCCESS (`rejectClientClaimedSuccess`)
- Not EVIDENCE-CLOSED / ADAPTIVE-READY / PRODUCT-COMPLETE

Adjacent legacy code practice evaluates code but does **not** write ULE LearningAttempts — bridging that is future dedicated work.
