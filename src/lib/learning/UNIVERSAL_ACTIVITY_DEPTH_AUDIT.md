# Universal Activity Depth Audit (2P-6)

> **Universal does not mean identical. Universal means each activity mechanism can plug into the same learning architecture while retaining the interaction/evaluation appropriate to its purpose.**

## 1. Current activity mechanisms

Eight Universal Activity kinds share one workspace shell, one server-evaluation boundary, one evidence spine (`recordEvidence` → `LearningAttempt` → `applyEvidenceToMastery` → `ConceptMastery`), and one Orchestrator / Adaptive / Assessment architecture:

| Kind | Mechanism | Adaptive-ready |
|------|-----------|----------------|
| Coding | Challenge + execute/evaluate | Yes |
| SQL | Educational sql.js challenge | Yes |
| Lab | Structured procedure + rubric | Yes |
| Simulation | Scenario decisions + rubric | Yes |
| Presentation | Outline/demo artifact + PERFORM | Yes |
| Game | Knowledge interaction + rubric | Product-only |
| Writing | Learner artifact + rubric | Product-only |
| Project | Requirements artifact + rubric | Product-only |

## 2. What makes an activity a meaningful learning experience

An activity answers:

1. **What am I trying to learn?** — concept/skill objective on the challenge
2. **What am I being asked to do?** — meaningful learner action (code, query, procedure, decision, artifact)
3. **How does the system know what I did?** — server-side evaluation of submitted work
4. **Did I demonstrate something?** — truthful SUCCESS / PARTIAL / FAIL
5. **How does that become evidence?** — `recordAuthoritativeActivityEvidence` only
6. **What happens next?** — Adaptive bind / re-orchestrate / Study Hub continuation

## 3. Activity vs interaction vs completion vs evidence

```
OPEN → INTERACT → EVALUATE → COMPLETION GATE → EVIDENCE → LEARNING ATTEMPT → CONCEPT MASTERY
```

- **Open** ≠ attempt ≠ completion ≠ evidence ≠ mastery
- Finish without required work must not invent SUCCESS (SQL starters no longer pre-fill answers; rubric `minChars` rejects stubs)

## 4. Evaluation contracts

All kinds use `UniversalEvaluationResult` (`serverAuthoritative`, outcome, optional score, `skillFacet`, details). Client forgery fields are stripped. Not every activity produces a percentage — rubric ratio or binary PASS/FAIL is enough.

## 5. Coding depth

**Sufficient for learning (JS):** objective, editable starter (scaffold only), vm sandbox execution, test-based evaluation, FAIL on wrong behavior, PERFORM facet, Adaptive binding.

**Honest limitation:** Python/Java remain **structural** criteria (not full runtimes). Documented; deferred production compilers.

## 6. SQL depth

**Enhanced (2P-6):** starters were full correct queries — learners could Submit without reasoning. Starters are now incomplete scaffolds (`SELECT ` + comment). Correct SELECT still succeeds; empty/stub/destructive fail. Educational sql.js only; destructive SQL blocked.

Capable today: filtering, projection, basic WHERE. Joins/aggregation possible if future challenges add seeded schemas — not expanded for appearance.

## 7. Lab depth

**Enhanced:** same Lab mechanism now has representative fixtures for **chemistry**, **networking**, and **electrical** procedural labs (configure/test/observe or connect/measure/diagnose). Rubric + optional `minChars`. PERFORM facet. Not a physics/chemistry/electronics engine.

## 8. Simulation depth

**Enhanced:** same Simulation mechanism fixtures for **business**, **nursing**, **networking**, **automotive**. Rules metadata describes state/transitions for content authors; evaluation remains explicit rubric on learner decisions (rules are not a full runtime state machine — deferred). APPLY/SOLVE facets as appropriate.

## 9. Game depth

Meaningful knowledge requirement via rubric; points ignored. **Not** Adaptive-ready (intentional).

## 10. Writing depth

Learner-authored artifact + explicit rubric; EXPLAIN; `minChars` gate. Domain-general (not English-only). Not Adaptive-ready.

## 11. Project depth

Objective / milestone / criteria artifact + rubric. Not PM software. Not Adaptive-ready.

## 12. Presentation depth

Outline artifact + PERFORM; Adaptive-ready. Not a slide CMS.

## 13. Domain generalization

Content contract: `Activity mechanism + structured content + Concept + domainTag/context + criteria`.

No `NetworkingActivity` / `NursingMastery`. Domain tags on fixtures are **content labels**, not engines. Orchestrator still uses mechanism cues (2P-5); unrecognized `subjectDomain` alone does not fabricate activities.

## 14. Adaptive integration

Preserved Adaptive-ready: Coding, SQL, Lab, Simulation, Presentation. Evidence-driven completion gates unchanged. Launch ≠ complete.

## 15. Assessment integration

Assessment remains a separate workflow/adapters path. Quiz/Flashcard not collapsed into Universal Activity intervention.

## 16. Evidence / mastery integration

```
Activity → recordEvidence → LearningAttempt → applyEvidenceToMastery → ConceptMastery
```

No activity-specific mastery stores. Facets used: RECOGNIZE, EXPLAIN, APPLY, SOLVE, PERFORM (as justified). No new facets.

## 17. Learner-facing UX

Learners see challenge title/prompt/workspace controls — not EvidenceEnvelope / activityIntervention / adapterKey. Architecture terms stay internal.

## 18. Failure / recovery

Invalid input, wrong answers, empty artifacts, destructive SQL, and evaluation failures return FAIL/PARTIAL without success evidence forgery. Legitimate FAIL/PARTIAL evidence remains allowed by the existing contract.

## 19. What was enhanced

- SQL starters → incomplete scaffolds (P0 click-through fix)
- Rubric optional `minChars` depth gate
- StructuredChallenge `domainTag` + `minChars`
- Additive Lab fixtures: networking, electrical (chemistry retained)
- Additive Simulation fixtures: nursing, networking, automotive (business retained)
- Depth + cross-activity test suite

## 20. What was already sufficient

- Coding JS execution path and Adaptive binding
- SQL educational evaluator + destructive blocking
- Shared ActivityWorkspace → POST → server eval → evidence
- Adaptive vs product-ready split
- Assessment separation
- Domain-generalization policy from 2P-5

## 21. What was deferred

- Full domain simulators (networking/electrical/nursing/automotive/chemistry engines)
- Production compilers / DB access
- Executable Simulation state machine (rules remain descriptive metadata)
- Promoting Game/Writing/Project to Adaptive-ready
- Giant content packs / subject taxonomy
- LLM activity selector

## 22. Remaining limitations

- Lab/Simulation/Writing/Game/Project/Presentation evaluation is keyword-rubric depth, not expert AI grading or physical simulation
- Python/Java coding structural-only
- SQL challenge set is intentionally small
- Simulation `rules` are not executed as a state machine

---

**Acceptance:** An activity can require meaningful work, evaluate truthfully, produce evidence into ConceptMastery, and continue the ULE loop. The same Lab/Simulation mechanisms represent multiple domains without new subject engines.
