# Universal Learning Content Pipeline (2P-8)

> **Source material informs learning. It does not itself create mastery.**

> **Concept defines what is being learned. Activity mechanism defines how it is practiced. Content defines the actual learning experience. Evaluation determines what was demonstrated.**

> **The content pipeline prepares learning experiences; the Orchestrator remains the learning decision engine.**

## 1. Source Material

Opaque `ContentSourceRef`: identity, type, title, optional locationRef, owner, LearningSpace, short excerpt.  
Does **not** duplicate full PDFs/notes. Types include `core_note`, `chapter_extract`, uploaded/syllabus/course/textbook/instructor/learner/fixture.

`Source ≠ Evidence`. Importing never creates LearningAttempt or ConceptMastery.

## 2. Knowledge

Concepts (and related Knowledge Model entities) remain the knowledge layer. Topics/Courses stay curriculum/space structures — **Concept is the universal knowledge atom**.

## 3. Concept grounding

Reuse CORE Knowledge bridge (`previewCoreKnowledgeBridge` → candidate Concepts → learner confirm → linked Concept).  
Pipeline does **not** invent a second grounding algorithm. Ownership via existing Concept + source owner checks.

Thin adapter: `content-pipeline/from-core.ts` maps CORE note / ChapterStudyExtract LOs → `LearningObjectiveSpec` after a confirmed `conceptId`. Opt-in publish path: `requireOwnedConcept: true` → `assertOwnedConcept`.

## 4. Learning Objective

`LearningObjectiveSpec`: objectiveId, conceptTitle, optional conceptId, objective text, domainContext, requiredCharacteristics, preferredFacet.  
Generic “complete this activity” objectives are rejected.

## 5. Learning Characteristics

Reuse `ActivityLearningCharacteristic` from 2P-5 capability registry (practice, troubleshooting, explanation, …).  
Not a subject taxonomy.

## 6. Activity Capability

`suggestActivityKindsForObjective` ranks Universal Activity mechanisms whose capabilities support required characteristics.  
**Informational only** — does not override Orchestrator diagnosis/policy.

## 7. Content Preparation

```
Source + Objective (+ optional activityKind/contentId)
  → prepareLearningContent
  → selectActivityContent (2P-7 catalog)
  → PreparedLearningContent (DRAFT or READY)
```

Never writes mastery, never records evidence, never changes diagnosis.

## 8. Validation

`validatePreparedLearningContent` checks identity, meaningful objective, catalog content + evaluation mode, capability compatibility, source ownership, confirmation gate.

Statuses: `DRAFT` → `READY` → `PUBLISHED` (or `ARCHIVED`). Unvalidated DRAFT must not enter Adaptive as learner-facing.

## 9. Content Identity

`preparationId`, `contentId` (catalog), `contentVersion` (`v1:contentId:objectiveId`).  
Not LearningAttempt / Adaptive run ids.

## 10. Content Reuse

Same prepared `contentId` usable by standalone activity, Adaptive launch, Assessment adapters, future tutor practice. Attempts remain separate.

## 11. Content Variants

Multiple catalog rows / preparation inputs can target the same Concept (e.g. DHCP → Simulation vs Lab). Deterministic selection via 2P-7.

## 12. Content Versioning

Lightweight `contentVersion` string — not git/VCS. Distinguishes what was prepared when evidence later cites `contentId`.

## 13. Ownership

Source owner + Concept ownership (existing `assertOwnedConcept` on submit). Foreign source fails validation.

## 14. Evidence provenance

After learner acts: activity evidence may cite `contentId` / objective (2P-7 payloadRef). Pipeline does not invent evidence.

## 15. Adaptive integration

Pipeline prepares eligible content. Adaptive still: Orchestrator → step → launch → interact → evaluate → completion → evidence → bind. Unconfirmed DRAFT is not learner-facing.

## 16. Assessment separation

Quiz/Flashcard remain specialized. Pipeline may supply concept context; Assessment workflow stays separate.

## 17. SIX relationship

SIX remains first-class fallback. Pipeline must not bypass SIX when UA capability/content is insufficient.

## 18. LUCKY relationship

Source import never auto-creates Lucky mastery. Only retention evidence updates the Learner Model.

## 19. Human confirmation

`confirmed: false` → DRAFT; validation requires confirmation before READY/PUBLISHED. Prefer human-confirmed content; automation later.

## 20. AI boundary

No LLM lesson/quiz/activity generators, no autonomous publish, no AI mastery claims in 2P-8.  
Future: AI → candidate → validation → confirmation → published content.

## 21. Representative domain flows

| Domain | Fixture | Mechanism | Content |
|--------|---------|-----------|---------|
| CS | Java inheritance notes | Coding | `java-inheritance-subclass` |
| Networking | DHCP material | Simulation / Lab | `sim-network-fault` / `lab-network-connectivity` |
| Business | Supply & demand | Simulation | `sim-supply-demand` |

## 22. Deferred

- Persistent CMS / Prisma content tables
- LLM preparation assistants
- Automatic Adaptive inject of prepared content
- Giant libraries / embedding search
- Hard domain↔content reject on every submit
- Assessment `activityRef` hygiene beyond current adapters

---

Module: `src/lib/learning/content-pipeline/`
