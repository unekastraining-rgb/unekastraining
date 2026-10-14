# UNIVERSAL_RETENTION_IMPLEMENTATION_REPORT — 2P-38

## 1. Files changed / added

| Path | Change |
|------|--------|
| `src/lib/learning/UNIVERSAL_RETENTION_AUDIT.md` | Audit |
| `src/lib/learning/UNIVERSAL_RETENTION.md` | Contract doc |
| `src/lib/learning/retention/types.ts` | RetentionReason / Candidate / cap |
| `src/lib/learning/retention/candidates.ts` | Deterministic selection |
| `src/lib/learning/retention/reason-copy.ts` | Learner-friendly labels |
| `src/lib/learning/retention/variants.ts` | Multi-domain RETAIN variants |
| `src/lib/learning/retention/candidates.test.ts` | Unit tests |
| `src/lib/learning/retention/review.ts` | Selection + variants + reasonLabel |
| `src/lib/learning/retention/service.ts` | metadataMerge on outcome |
| `src/lib/learning/retention/bridges.ts` | Adaptive/misconception tags |
| `src/lib/learning/retention/index.ts` | Exports |
| `src/lib/learning/sequence/lucky-handoff.ts` | `fromAdaptiveCompletion` |
| `src/components/study/LuckyRetentionReview.tsx` | reasonLabel UI |
| `e2e/lucky-handoff.spec.ts` | GET ≠ attempt; submit creates attempt |
| Tests updated | review / lucky-handoff |

## 2. Architecture decisions

- No second retention engine; RetentionItem remains SoT
- Candidates derived from existing items only
- Variants are content catalog, not subject engines
- Orchestrator RETENTION_GAP still does not create Lucky items (intentional)

## 3. Behavior changes

- Deterministic capped candidate ranking
- WEAK_MASTERY / post-miss may use concept-aligned variant prompts
- Friendly “why this review” copy
- Adaptive COMPLETE tags ADAPTIVE_COMPLETION
- After FAIL, prefer different concept for next item when available

## 4–5. Security / evidence

- Ownership unchanged (userId from session)
- GET still creates no LearningAttempt
- Submit still → recordEvidence → applyEvidenceToMastery

## 6–11. Verification

| Check | Result |
|-------|--------|
| Retention + handoff unit | **49** passed / 4 files |
| `src/lib/learning` | **1605** passed; **1** flaky timeout in `quiz-bridge.test.ts` under full suite load (re-run alone **8/8 PASS**) |
| Playwright `e2e/lucky-handoff.spec.ts` | See STATUS |
| Build | **PASS** |
| ESLint (retention + handoff + LuckyRetentionReview) | **PASS** |
| `tsc --noEmit` | **PASS** |
| Prisma validate | **PASS** |

## 12. Deferred

FSRS for RetentionItem; Orchestrator-fed planner; TUTOR_FLAG writers; full RETAIN for every concept; answer reveal.
