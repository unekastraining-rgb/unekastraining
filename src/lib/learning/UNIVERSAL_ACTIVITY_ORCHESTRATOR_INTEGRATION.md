# 2G-72 — Universal Activity → Orchestrator Intervention Integration

## 1. What 2G-72 adds

A **post-diagnosis** activity capability registry + deterministic policy that may attach an additive `activityIntervention` on `OrchestratorResult`.

It does **not** change diagnosis rules, replace SIX, or write evidence/mastery.

## 2. Diagnosis vs intervention selection

| Responsibility | Owner |
|----------------|--------|
| What the learner needs | `diagnose.ts` (evidence/mastery facets) |
| Soft SIX preference | `intent-preference.ts` (after diagnosis) |
| Legal activity suggestion | `activity-intervention-policy.ts` (after diagnosis + decision context) |

Activity capability **never** feeds into diagnosis.

## 3. Capability vs availability

- **Capability** — declarative: which diagnoses/intents/facets an activity *may* serve.
- **Availability** — launch + evidence integration + owned `conceptId` + concept/topic context match when required.

`PRODUCT-READY ≠ ORCHESTRATOR-SELECTABLE.`

## 4. Current activity classifications

| Activity | Role | Auto-selectable? |
|----------|------|------------------|
| SIX | Canonical intervention | Yes (primary `intervention`) |
| Coding | intervention_capable | Yes when APPLICATION_GAP + PRACTICE + coding context |
| SQL | intervention_capable | Yes when APPLICATION_GAP + PRACTICE + SQL context |
| Lab | intervention_capable | Yes when APPLICATION_GAP + PRACTICE + lab/science context |
| Simulation | intervention_capable | Yes when APPLICATION_GAP + PRACTICE + sim/econ context |
| Presentation | intervention_capable | Yes when APPLICATION_GAP + PRACTICE/CREATE intent rules + presentation context |
| Game | intervention_capable | **No** (`interventionEligible: false`) |
| Writing | intervention_capable (2P-18 Adaptive-ready) | Yes when APPLICATION_GAP + PRACTICE + writing context |
| Project | create_only | **No** |
| Quiz | assessment_only | **No** (Assessment workflow) |
| Flashcard | assessment_only | **No** |

## 5. Automatically selectable (today)

Only when **all** hold:

1. `interventionEligible`
2. Diagnosis ∈ supported set (currently APPLICATION_GAP for activity types)
3. Explicit PRACTICE intent (when `requiresExplicitIntent`)
4. Not ASSESS / CREATE as generic unlock
5. Concept/topic context matches hints
6. Launch + evidence integrated
7. Non-empty owned conceptId

## 6. Specialized (not auto-selected)

ASSESS → Assessment workflow (`assessmentHandoff`)  
CREATE → creation workflows  
Quiz / Flashcard → assessment adapters  
Project → create_only  
Writing → Adaptive-ready universal activity (2P-18); selectable under APPLICATION_GAP + PRACTICE + context  
Game → registered but not auto-eligible  
UNDERSTANDING / RECALL / RETENTION / INSUFFICIENT / NO_INTERVENTION → no activity auto-select

## 7. SIX preservation

Primary `intervention.kind` remains `"six"`.  
Diagnosis → SIX mappings unchanged.  
Activity suggestion is additive metadata + Hub secondary link.

## 8. Assessment separation

ASSESS still routes through Assessment Workflow.  
Quiz is not a generic Orchestrator intervention.  
ASSESS intent blocks activity auto-select.

## 9. Intent interaction

Intent remains soft preference / workflow signal.  
Precedence: safety/evidence integrity > diagnosis > … > intent preference.  
PRACTICE may unlock legal activity candidates; it cannot change UNDERSTANDING_GAP into Coding.

## 10. Adaptive interaction

Activity href launches `/study/activities/{kind}?conceptId=…`.  
Existing Adaptive bind via `adaptiveRunId` on submit remains.  
Orchestrator does **not** auto-create Adaptive runs.  
No new Adaptive step types in the run shell this phase (deferred).

## 11. Evidence / mastery ownership

Orchestrator never calls `recordEvidence` / `applyEvidenceToMastery`.  
Activities own evaluation → LearningAttempt → ConceptMastery.

## 12. PERFORM

PERFORM-capable activities may list `performCapable: true`.  
**PERFORM_GAP is not added** to the Orchestrator.

## 13. Security / ownership

No client activity IDs trusted for selection.  
Href embeds server-known conceptId from Orchestrator result.  
Activity submit path still enforces owned concept (2G-71).

## 14. Deferred

- Subject-specific LLM selection  
- Adaptive run-shell step adapters for new activities  
- Auto-select without explicit PRACTICE  
- Game auto-eligibility  
- Rich curriculum generation / IDEs / full language runtimes  

## 15. Files changed

**Added**

- `orchestrator/activity-intervention-capability.ts`
- `orchestrator/activity-intervention-policy.ts`
- `orchestrator/activity-intervention.test.ts`
- `UNIVERSAL_ACTIVITY_ORCHESTRATOR_INTEGRATION.md`

**Modified**

- `orchestrator/diagnose.ts` — finish() applies `withActivityInterventionSuggestion`
- `orchestrator/present.ts` — surfaces `activityIntervention`
- `orchestrator/index.ts` — exports
- `OrchestratorSuggestionCard.tsx` — additive practice link
- Boundary test slices ignore `activityIntervention` for parity
