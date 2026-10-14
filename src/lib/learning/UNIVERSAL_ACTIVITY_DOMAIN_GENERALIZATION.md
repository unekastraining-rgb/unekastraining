# Universal Activity Domain Generalization (2P-5)

**Mode:** Architectural proof + small additive capability metadata.  
**Not:** New subject engines, taxonomies, networking/nursing simulators, or LLM selection.

---

## 1. Universal Activity principle

```text
Subject/domain  = what the learner is learning (content)
Concept/skill   = knowledge or capability atom
Activity type   = how the learner practices/demonstrates it (mechanism)
```

Activities are **mechanisms**, not subjects.

Wrong: `Coding = Programming subject`  
Right: `Coding = practice/application/construction mechanism` usable wherever context fits.

---

## 2. Activity capability vs domain

| Layer | Answers |
|-------|---------|
| Capability registry | Can this activity *legally* serve as an intervention? What characteristics does the *mechanism* support? |
| Compatibility | Does available context (subjectDomain / title / topic) fit this activity’s hints? |
| Availability | Is a usable owned activity currently launchable? |
| Ranking | Deterministic tie-break among MATCH candidates |

`supportsLearningCharacteristics` (2P-5) documents mechanism traits such as:

`practice`, `application`, `troubleshooting`, `scenario_reasoning`, `procedural_execution`, …

It does **not** invent a subject taxonomy and does **not** replace diagnosis.

---

## 3. Domain / context role

`Concept.subjectDomain` / `LearningSpace.subjectDomain` are free-form `String?`.

Domain may inform compatibility phrase matching.

Domain must **not** independently decide “networking ⇒ Simulation.”

---

## 4–5. Compatibility & availability

```text
Compatibility = pedagogical fit given context
Availability  = usable activity exists now
```

`MATCH + unavailable` → safe fallback (no fabricated activity).  
Availability never alters Orchestrator diagnosis.

---

## 6. Orchestrator boundary

```text
Learner state + evidence (+ soft intent)
        ↓
Diagnosis (evidence/mastery authored)
        ↓
SIX intervention (first-class)
        ↓
optional activityIntervention (capability → compatibility → availability → rank)
```

Diagnosis semantics unchanged. Domain is selection context only.

---

## 7. SIX relationship

SIX remains primary. Activities are optional when applicable.  
No compatible activity → **no fabricate** → SIX remains.

---

## 8. Adaptive relationship

Adaptive-ready today: Coding, SQL, Lab, Simulation, Presentation (+ Quiz/Flashcard adapters).

PRODUCT-READY, not Adaptive-ready: Game, Writing, Project.

Lifecycle unchanged: launch → evidence → completion gate → bind → ConceptMastery → re-orchestrate.

---

## 9. Assessment relationship

ASSESS remains a separate workflow. Quiz/Flashcard stay assessment_only — not generic activity interventions.

---

## 10. Evidence / mastery

```text
Activity evaluation → recordEvidence → LearningAttempt → ConceptMastery
```

No DomainMastery / LabMastery / SimulationMastery.

---

## 11–12. New-domain & unknown-domain behavior

**New domain (e.g. networking, electrical, nursing):**

- Capability evaluation runs
- Unrecognized domain string → `INSUFFICIENT_CONTEXT` for hint-gated activities
- No fabricated activity
- SIX remains

**Mechanism cues** (procedure, measurement, scenario, decision) may MATCH when present in title/topic — capability-oriented, not `domain → activity` maps.

**Unknown domain:** safe; no crash; SIX fallback.

---

## 13–14. Adaptive-ready inventory

| Adaptive-ready | Not Adaptive-ready (intentional) |
|----------------|----------------------------------|
| Coding, SQL, Lab, Simulation, Presentation | Game, Writing, Project |

---

## 15. Intentionally NOT built

- Networking / electrical / nursing / automotive simulators  
- Subject taxonomy enums  
- LLM activity generation  
- New Orchestrator / Adaptive / mastery / evidence systems  
- Promoting Game/Writing/Project to Adaptive  

---

## Conceptual examples (architecture only)

```text
NETWORKING
  → Concept: Diagnose subnet connectivity
  → APPLICATION_GAP + PRACTICE
  → Compatible mechanisms if context/hints fit: Simulation, Lab, Coding…
  → else SIX only
  → Evidence → ConceptMastery

ELECTRICAL
  → Concept: Diagnose circuit fault
  → APPLICATION_GAP + PRACTICE
  → Lab/Simulation characteristics apply as mechanisms
  → Evidence → ConceptMastery
```

---

## 16. Tests

`src/lib/learning/orchestrator/universal-activity-domain-generalization.test.ts`

Covers networking / electrical / nursing / unknown, diagnosis independence, determinism, SIX fallback, Adaptive inventory, regressions.

---

## 17. Deferred

1. Broader mechanism hint coverage for trades/healthcare (only when product needs auto-select)  
2. Domain-agnostic content packs for Lab/Simulation payloads  
3. Promoting Game/Writing/Project when Adaptive contracts exist  
4. Learner-facing Activity Workspace copy polish per concept (not architecture)

---

## Architecture confirmation

ONE ULE · ONE Learner Model · ONE Knowledge Model · ONE Evidence · ONE Mastery · ONE Orchestrator · ONE Adaptive · ONE Retention  

Activities = mechanisms · Domains = content · Diagnosis = evidence/mastery · SIX first-class · No subject engines · No fabricated activity · Deterministic · CORE → SIX → LUCKY preserved  
