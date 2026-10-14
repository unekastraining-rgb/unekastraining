# CROSS_MODAL_LEARNING — 2P-42

## Why this phase exists

Study Haul already has many authentic interactions (SIX, Tutor, activities,
math/networking/language workspaces). Learners should move between them based on
**evidence of what they need next** — not infinite repeats of the same kind, and
not random variety.

## Existing universal capabilities (unchanged ownership)

- Orchestrator diagnosis from ConceptMastery facets
- SIX techniques per diagnosis
- Activity intervention policy (APPLICATION_GAP + PRACTICE)
- AdaptiveSequenceRun history + plan-next
- Evidence → LearningAttempt → ConceptMastery → LUCKY eligibility

## Evidence-driven intervention variety (2P-42)

1. **Soft demotion** of recently used Adaptive activity adapter keys in ranking  
2. **Immediate-repeat alternate**: when Orchestrator would repeat the last step,
   try one legal alternate (activity exclude or SIX co-eligible) before STOP  
3. **Soft SOLVE preference** under APPLICATION_GAP when solve facet is weak  

Variety is never forced: a sole legal match still wins; STOP remains when no
legal alternate exists.

## Cross-modal transitions (supported)

| Transition | Mechanism |
|------------|-----------|
| Explain → Apply | UNDERSTANDING → APPLICATION_GAP (+ hands-on / activity) |
| Apply → Solve | Soft prefer SOLVE-producing adapters (no new diagnosis) |
| Solve / Apply → Retain | RETENTION/RECALL_GAP when apply strong + retain weak |
| Recall → Explain | Re-diagnosis when understand facets regress |
| Same-need alternate | Legal SIX co-eligible or next ranked activity |

## What we do not do

- CrossModalEngine / JourneyEngine / ModalityMastery  
- Random rotation  
- Visible intervention scores  
- Misconception engines (signals stay reason/hint)  
- Forced harder activities after success  

## Adaptive / LUCKY

Adaptive remains the sequence coordinator. LUCKY remains retention via
ConceptMastery eligibility only.
