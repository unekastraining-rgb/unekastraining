# Universal Content Contract (2P-7)

> **Concept defines what is being learned. Activity mechanism defines how it is practiced. Content defines the actual learning experience. Evaluation determines what was demonstrated. Evidence updates the universal Learner Model.**

> **Domain provides context; it does not become a subject-specific learning engine.**

## 1. Concept

A Concept is the learning target (Knowledge Model / owned Concept row). Evidence and ConceptMastery always attach to a server-validated, learner-owned `conceptId`.

## 2. Domain / context

Optional free-form `domainTag` / `subjectDomain` labels content and informs **compatibility** (2P-5). Domain alone must not select an activity mechanism or invent a subject engine.

## 3. Activity mechanism

Coding, SQL, Lab, Simulation, Game, Writing, Project, Presentation — universal interaction types. Selected by Orchestrator diagnosis + intent + capability + compatibility + policy + availability.

## 4. Activity content

Reusable challenge templates identified by opaque `contentId` (= challenge id). Content includes title, objective, task/prompt, starter, evaluation criteria, optional domainTag, conceptHints.

Module: `src/lib/learning/activities/content-contract.ts`

## 5. Objective

Every content item declares what the learner will **demonstrate** (not “complete this activity”).

## 6. Task

The concrete prompt/work the learner performs (`prompt` / task field).

## 7. Evaluation

Separate from content narrative: JS execution, structural patterns, sql.js row compare, or explicit rubric. Lightweight by design in this phase — not expert AI grading.

## 8. Evidence

```
Content → Activity submit → server evaluation → recordEvidence → LearningAttempt → applyEvidenceToMastery → ConceptMastery
```

`payloadRef` carries `contentId` + `objective` so evidence can explain *what* was practiced for *which* concept.

## 9. Mastery

ConceptMastery only. No subject-specific mastery stores. Facets follow the activity (PERFORM / APPLY / EXPLAIN / …).

## 10. Reusable content

Templates are shared catalogs — not per-learner, per-run, or per-attempt rows. Standalone, Adaptive, and Assessment adapters may reference the same `contentId`.

## 11. Activity template vs instance

```
Template (contentId)
  → Launch (conceptId, optional adaptiveRunId)
  → Learner interaction (attempt work)
  → LearningAttempt + Evidence
```

Learner work must not mutate the template catalog.

## 12. Content identity

`contentId` answers: which learning task was presented?  
It is **not** LearningAttempt id, Adaptive run id, or Concept id.

## 13. Ownership

- Page + submit: concept must be owned (`assertOwnedConcept` / page ownership check).
- Adaptive: `assertAdaptiveLaunchConceptMatch` rejects submit when `conceptId` ≠ Adaptive run concept (before evidence write).
- Adaptive bind still enforces `concept_mismatch` on completion eligibility.
- Client cannot forge learnerId / mastery / outcome.

## 14. Content variation

Multiple content rows per mechanism (e.g. SQL select vs filter; Lab chemistry/networking/electrical). Variants are explicit catalog entries — no random generator, no LLM.

## 15. Determinism

`selectActivityContent({ activityKind, conceptTitle?, subjectDomain?, contentId? })`:

1. Explicit `contentId` if valid  
2. Else best `conceptHints` score vs concept title  
3. Else domain context fallback  
4. Else stable sorted catalog default  

Same inputs → same selection. Refresh does not reshuffle.

## 16. Adaptive integration

Mechanism still selected by Orchestrator → Adaptive step → launch with conceptId → content recommendation via GET `?conceptId=` → interact → evaluate → evidence → bind → ConceptMastery → re-orchestrate.

Content selection does **not** bypass Orchestrator, completion gates, or evidence.

## 17. Assessment integration

Assessment remains Workflow → Adapter → Activity → Evidence. Content catalogs may be shared; Assessment orchestration is not collapsed into Universal Activity intervention.

## 18. SIX fallback

If capability/content/context insufficient, Orchestrator keeps SIX. Content layer must not fabricate an activity to force UA usage.

## 19. AI boundary (2P-7)

No LLM lesson/question generation, no embedding retrieval, no AI content selector, no AI grading expansion in this phase.

## 20. Representative examples

| Mechanism | Example contentId | Domain | Concept cue |
|-----------|-------------------|--------|-------------|
| Coding | `java-inheritance-subclass` | computer science | inheritance |
| SQL | `sql-high-grades` | computer science | filtering |
| Lab | `lab-network-connectivity` | networking | DHCP/connectivity |
| Lab | `lab-circuit-fault` | electrical | circuit fault |
| Lab | `lab-observe-density` | chemistry | density |
| Simulation | `sim-network-fault` | networking | DHCP/DNS fault |
| Simulation | `sim-patient-triage` | nursing | clinical decision |
| Writing | `write-business-proposal` | business | proposal |
| Project | `project-software-feature` | computer science | software feature |
| Presentation | `presentation-history-sources` | history | source analysis |
| Game | `game-network-terms` | networking | DHCP/DNS vocab |

## 21. Deferred

- Large content libraries
- LLM / embedding content systems
- Executable simulation engines / compilers / production DBs
- Forced concept↔content binding table in Prisma
- Promoting product-only activities to Adaptive-ready

---

**Acceptance:** Concept-grounded objectives + reusable content + truthful evaluation update ConceptMastery through the existing ULE loop, without subject engines or a second learning architecture.
