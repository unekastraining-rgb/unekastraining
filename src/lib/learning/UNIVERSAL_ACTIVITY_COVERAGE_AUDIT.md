# Universal Activity Coverage Audit (2P-23)

## Verdict

**PASS WITH NOTES** — inventory reconciled to live code; one inventory P1 closed (Simulation facets); Writing Adaptive doc drift closed; `PERFORM_GAP` deferred as architecture (not invented).

## Methodology

1. Inspected producer inventory, coverage metadata, Adaptive completion contracts, intervention capability, decision-loop keys, structured/coding/sql services, evaluate/tutor/quiz/flashcard/lucky bridges, Adaptive bind route.
2. Compared docs vs live registries.
3. Closed only genuine inventory integrity P1s with additive metadata + doc sync.
4. Did **not** invent `PERFORM_GAP`, second engines, or Adaptive promotion of Game/Project.

---

## 1. Complete activity inventory

| Activity | Exists | Evidence producer | Adaptive lane |
| --- | --- | --- | --- |
| CORE | Yes | Outside (entry) | Via Continue → Adaptive start |
| SIX (6 techniques) | Yes | `study_evaluate` CLOSED | six-adapter |
| Tutor (authorized) | Yes | `tutor` CLOSED | Not Adaptive |
| Tutor (public API) | Yes | Outside | — |
| Quiz | Yes | `quiz` CLOSED | quiz-adapter |
| Flashcards | Yes | `flashcard` CLOSED | flashcard-adapter |
| LUCKY retention | Yes | `lucky_retention` CLOSED | Not Adaptive |
| Coding | Yes | `coding` CLOSED | Universal Adaptive |
| SQL | Yes | `sql` CLOSED | Universal Adaptive |
| Writing | Yes | `writing` CLOSED | Universal Adaptive (2P-18) |
| Lab | Yes | `lab` CLOSED | Universal Adaptive |
| Simulation (+ Educational Market) | Yes | `simulation` CLOSED | Universal Adaptive |
| Presentation | Yes | `presentation` CLOSED | Universal Adaptive |
| Game | Yes | `game` CLOSED | Product-only |
| Project | Yes | `project` CLOSED | Product-only |
| Growth Center / Hub / Study Now | Yes | Outside (entry) | Existing bridges |
| Legacy code-evaluate | Yes | PARTIAL TopicMastery | Outside ULE |

---

## 2. Lifecycle matrix (conceptual contract)

```text
resolve → prepare → launch → interact* → produce evidence* → completion gate → bind → return
```

| Activity | Resolve | Prepare | Launch | Interact | Evidence | Completion | Adaptive bind | Return |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coding/SQL | ✓ catalog | ✓ | ✓ activity page | ✓ submit | ✓ authoritative | ✓ gate | ✓ | ✓ |
| Writing/Lab/Sim/Presentation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Game/Project | ✓ | ✓ | ✓ | ✓ | ✓ | product | — | standalone |
| SIX | ✓ | ✓ | ✓ | ✓ evaluate | ✓ | six gate | six-adapter | ✓ |
| Quiz/Flashcard | ✓ | ✓ | ✓ | ✓ | ✓ | assessment | dedicated adapters | ✓ |
| Tutor | ✓ | ✓ | ✓ | ✓ chat | gated | n/a Adaptive | — | — |
| LUCKY | ✓ | ✓ | ✓ | ✓ review | ✓ | retention | — | queue |
| CORE | notes | — | /core | ink/notes | no | — | entry CTA | — |

---

## 3. Evidence matrix

| Activity | Creates `LearningAttempt`? | Path |
| --- | --- | --- |
| Coding/SQL/Writing/Lab/Sim/Game/Project/Presentation | Yes | `recordAuthoritativeActivityEvidence` |
| SIX / Study Evaluate | Yes (topicId) | `recordStudyEvaluateEvidence` |
| Quiz / Flashcard | Yes | quiz/flashcard bridges |
| Tutor authorized | Yes (gated) | `maybeRecordTutorEvidence` |
| Lucky | Yes | `submitRetentionReview` |
| CORE / Hub browse / public Tutor | No | intentional |
| Adaptive bind | No (consumes Attempt) | PARTIAL |

No CodingEvidence / WritingEvidence / etc. — shared spine only.

---

## 4. Mastery facet matrix

| Activity | Recognize | Explain | Apply | Solve | Perform | Retain |
| --- | --- | --- | --- | --- | --- | --- |
| Quiz | ✓ | | | | | |
| Flashcard | | | | | | ✓ |
| SIX/Evaluate | ✓ | ✓ | ✓ | | | ✓ |
| Coding/SQL/Lab/Presentation | | | | | ✓ | |
| Simulation | | ✓ | ✓ | ✓ | | |
| Writing | | ✓ | | | | |
| Game | ✓ | | | | | |
| Project | | | ✓ | | | |
| Tutor | | ✓ | ✓ | ✓ | | |
| Lucky | | | | | | ✓ |

---

## 5. Adaptive readiness matrix

| Class | Activities |
| --- | --- |
| **A Fully Adaptive-ready** | coding, sql, lab, simulation, presentation, writing (+ SIX/Quiz/Flashcard dedicated lanes) |
| **B Product-ready, not Adaptive** | game, project, tutor (evidence), lucky |
| **C Partial** | adaptive_bind |
| **D Missing / outside** | public tutor evidence, CORE as evidence, legacy code-evaluate (ULE) |

---

## 6. Orchestrator consumption matrix

```text
Activity → LearningAttempt → ConceptMastery → getLearnerConceptMastery → orchestrateForConcept
```

- All CLOSED producers update ConceptMastery when `conceptId` present → Orchestrator can read.
- Universal activityIntervention selection: Adaptive-ready keys only (game/project/tutor not selectable).
- No second decision engine.
- **Limitation:** no `PERFORM_GAP` diagnosis — PERFORM updates mastery but does not emit a dedicated diagnosis code (deferred).

---

## 7. Abandonment / completion matrix

| Rule | Status |
| --- | --- |
| Launch / page open ≠ evidence | Enforced (submit required) |
| Client outcome/score stripped | `sanitizeClientActivitySubmission` |
| ABANDONED ≠ Adaptive step complete | Completion contracts |
| Evidence ≠ completion | Distinct paths |
| Duplicate / terminal protections | Existing Adaptive + activity gates |

---

## 8. Universal-domain matrix

Same activity architecture expresses Java/SQL/Networking/Nursing/Business/Finance/Math/Physics/Electrical/Automotive/History/Writing/Presentation/Simulation via **content + challenge catalog + skillFacet**, not subject engines. Educational Market is simulation content under universal simulation activity.

---

## 9. AI-boundary matrix

| Surface | Boundary |
| --- | --- |
| Writing / structured evaluate | Deterministic criteria + optional AI assist; authoritative evidence via server evaluation |
| Tutor | Explanation ≠ automatic evidence without intent/gates |
| Coding | Server evaluation authoritative |
| Public Tutor | No evidence authorization |

No AI detector added.

---

## 10. LUCKY / retention matrix

- Lucky sync after Adaptive **run** COMPLETE (existing).
- Activities do not invent retention queues.
- Lucky review → RETAIN Attempt when conceptId present.

---

## 11–12. Gaps (P0–P3)

### P0 — Integrity

None found that require code changes in this audit (ownership/bind/sanitization already present).

### P1 — Closed-loop / inventory

| Issue | Disposition |
| --- | --- |
| Simulation inventory understated facets (APPLY-only vs live SOLVE/EXPLAIN) | **Fixed** — producers + coverage inventory |
| Writing Adaptive docs still claimed not Adaptive | **Fixed** — coverage + expansion map synced |
| No `PERFORM_GAP` despite PERFORM producers | **Deferred** — architectural; do not invent in 2P-23 |

### P2 — Product completeness

- Game/Project not Adaptive-ready (intentional)
- TopicMastery dual-write on Quiz/Flashcard/Evaluate
- Legacy code-evaluate TopicMastery-only
- Stale secondary docs may still mention older Writing status (audit doc is authoritative with coverage.md)

### P3 — Future

- Richer rubrics / multi-round artifacts
- Browser E2E
- Foundation helper maturity cleanup

---

## 13. Fixes made

1. `producers.ts` — simulation facets APPLY/SOLVE/EXPLAIN; `FACET_PRODUCER_COVERAGE` SOLVE/EXPLAIN include simulation  
2. `activity-coverage.ts` — simulation facets aligned  
3. Tests updated for Simulation SOLVE coverage  
4. `UNIVERSAL_ACTIVITY_COVERAGE.md` + expansion map Writing Adaptive truth  

## 14. Intentionally deferred

- Inventing `PERFORM_GAP`
- Promoting Game/Project to Adaptive-ready
- Merging multiple inventory views into one runtime registry
- Removing TopicMastery dual-write
- Browser E2E

## Registries (documented, not merged)

1. `LEARNING_ATTEMPT_PRODUCERS`  
2. `ACTIVITY_COVERAGE_INVENTORY`  
3. `ACTIVITY_INTERVENTION_CAPABILITIES`  
4. `ACTIVITY_ADAPTIVE_COMPLETION_CONTRACTS` / `ADAPTIVE_READY_ACTIVITY_KEYS`  
5. Assessment adapter instances (opt-in)  
6. Route `KINDS` set  

`activity-coverage.ts` remains metadata composition — not a second registry.
