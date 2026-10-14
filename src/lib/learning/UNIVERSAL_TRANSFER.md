# UNIVERSAL_TRANSFER — 2P-46

**Transfer is a property of the universal learning system, not a separate learning engine.**

Architecture remains:

**CORE → SIX → LUCKY**  
**ONE ULE · ONE Learner Model · ONE Knowledge Model · ONE Evidence spine · ONE Mastery · ONE Orchestrator · ONE Adaptive · ONE Retention**

---

## Concept vs activity identity

| Identity | Role |
|----------|------|
| **Concept / skill** | What is being learned (`Concept.id`, progression `conceptKey`) |
| **Context / surface** | How it is practiced (`contextVariant`, `contentKey`, `contentId` in `sourceRef`) |

Same concept can appear in Context A, B, C. Cosmetic wording changes are **not** transfer.

## Meaningful context variation

Represented by authored metadata:

- `contextVariant` — scenario / framing / topology / equation surface
- `contentKey` / `contentId` — concrete learning object

Selectors soft-prefer alternates via existing:

- `selectProgressionContent({ avoidContextVariant, excludeContentKeys })`
- `resolveLearningExperience` + activities GET (from recent `LearningAttempt.sourceRefJson`)

## Transfer evidence

Uses existing `LearningAttempt` + facets (RECOGNIZE…PERFORM/RETAIN).  
No seventh facet. No `TransferRetention`. No separate mastery store.

## Mixed-context evidence

Read-side `interpretMixedContextEvidence`:

- single-context success → limited transfer claim
- success then fail in another context → practice needed elsewhere (not “lacks concept”)
- cross-context success → broader evidence (still subject to 2P-44 sufficiency)

## Orchestrator

Keeps **APPLICATION_GAP** / **INSUFFICIENT_EVIDENCE**.  
**No `TRANSFER_GAP`.** Cross-modal variety (2P-42) remains modality-level; scenario transfer is content-level.

## Adaptive

Unchanged contracts (max 12, no immediate exact repeat, STOP when no alternate).  
When Adaptive launches an activity GET, transfer hints soft-demote recent contexts.

## Evidence sufficiency (2P-44)

One alternate-context success ≠ rich mastery. Conflicting contexts stay cautious.

## Growth continuity (2P-43)

Optional learner-safe note when mixed-context reading applies. Never “mastered everywhere.”

## LUCKY

Unchanged: Evidence → ConceptMastery → RetentionItem → LUCKY.

## Specialized runtime

**Not necessary** — existing activities + metadata + evidence + Adaptive suffice.

## Deferred

- Domains without multi-context catalog entries cannot soft-transfer (honest limit)
- Per-context mastery aggregates (not required; facet + sourceRef remain sufficient)
