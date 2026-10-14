# UNIVERSAL_EXPERIENCE_DEPTH — Quality contract (2P-37)

Reusable definition of “deep” learning content inside the existing Universal Learning Engine.

---

## Concept journey (not one activity)

| Stage | Learner intent | Typical evidence facet |
|-------|----------------|------------------------|
| **INTRODUCE** | Encounter the idea | RECOGNIZE |
| **UNDERSTAND** | Explain meaning / why it matters | EXPLAIN |
| **PRACTICE** | Guided task | APPLY / SOLVE |
| **APPLY** | Use in a new context | APPLY / SOLVE |
| **CHALLENGE** | Less scaffold / unfamiliar case | SOLVE / PERFORM |
| **RETAIN** | Recall / re-demonstrate later | RETAIN |

Not every activity carries all six stages. The **concept progression catalog** should cover the journey.

---

## Authenticity checklist

A deep experience prefers authentic interactions over question count:

| Pattern | Maps to UA kinds (examples) |
|---------|------------------------------|
| Explain / Justify | writing, lab |
| Diagnose / Troubleshoot | lab, simulation |
| Calculate / Solve | lab, coding, sql |
| Decide / Tradeoff | simulation, project |
| Sequence / Perform | lab (asPerform), project |
| Construct / Revise | writing, presentation, coding |
| Simulate / Observe | simulation, lab |
| Recall | flashcard/quiz lanes or RETAIN structured |

Mastery facets remain only:

**RECOGNIZE · EXPLAIN · APPLY · SOLVE · PERFORM · RETAIN**

---

## Scaffolding levels (existing architecture)

| Level | Guidance | Reveal |
|-------|----------|--------|
| 1 | STEP / EXAMPLE — process without answer | ON_REQUEST |
| 2 | HINT — focus attention | ON_REQUEST |
| 3 | HINT — narrower cue | ON_REQUEST |
| Independent | No scaffold required | — |
| Challenge | Minimal or none | — |

`doesNotRevealAnswer: true` by default. Never use scaffolds as answer keys.

---

## Hint quality

| Weak | Better |
|------|--------|
| “The answer is 6.” | “Undo operations in reverse order on both sides.” |
| “Pick authorization.” | “Login succeeded — which control decides *what* you can open?” |

---

## Misconception loop (conceptual)

mistake → misconceptionSignals → targeted scaffold → similar-but-different practice → application  

Uses existing `misconceptionTargets` / evidence `misconceptionSignalsJson`. No second misconception DB.

---

## Variation

`contextVariant` must change scenario, numbers, distractors, or procedural path — not cosmetic wording alone.

---

## Quality dimensions (no product score)

Report as VERIFIED / PARTIAL / MISSING / DEFERRED:

- interaction completeness  
- progression completeness  
- evaluation quality  
- scaffolding quality  
- variation  
- misconception coverage  
- evidence integrity  
- accessibility  
- Adaptive readiness  

---

## Completion ≠ mastery

Activity completion does not imply ConceptMastery permanence. Failed/partial attempts remain truthful evidence.
