# Universal Content Production & Catalog Readiness (2P-15)

> **Inspection + design + small foundational hardening only.** This phase does **not** mass-produce domain content, build stock-market simulation runtimes, or create specialized activity engines.

**Closed foundation:** 2G architecture + 2P-1 → 2P-14 (including **ACTIVITY COMPLETION ≠ SUCCESS ≠ MASTERY** from 2P-13).

**Master expansion map:** `UNIVERSAL_PRODUCT_EXPANSION_MAP.md`

**Deterministic helpers added in 2P-15:** `src/lib/learning/content-production/` (lifecycle projection, catalog integrity audit, AI candidate validation wrapper, density matrix, design-time pack descriptors). **NOT a second content system.**

---

## 1. Executive summary

**Verdict: the current content architecture CAN scale universal learning content across domains without per-subject engines or a second content system.**

Study Haul already has a closed spine:

```
Concept → Content (2P-7) → Progression (2P-9) → Coverage (2P-10)
  → Experience (2P-11) → Scaffolding (2P-12)
  → Learner Interaction → Evaluation → Evidence → LearningAttempt
  → ConceptMastery → Learner Model → Orchestrator → Next Experience
```

What is **ready**:

| Layer | Status |
|-------|--------|
| Canonical content contract (objective, task, contentId, domain, evaluation mode) | **Closed** (2P-7) |
| Source → prepared content pipeline | **Closed** (2P-8) |
| Stage / difficulty / contextVariant variation | **Closed** (2P-9) |
| Availability / missing / incompatible truth | **Closed** (2P-10) |
| Learner experience projection | **Closed** (2P-11) |
| Scaffold / successLooksLike projection | **Closed** (2P-12) |
| Domain-general activity catalogs | **Proven** (Coding, SQL, Lab, Sim, Writing, …) |
| Assessment (Quiz/Flashcard), SIX, LUCKY, CORE | **Separate but compatible** |
| AI-safe candidate entry | **Wrapper added** (`validateAiContentCandidate`) |

What is **not ready for product breadth** (content depth, not architecture):

| Gap | Nature |
|-----|--------|
| Catalog size | ~24 Universal Activity templates + thin progression fixtures |
| Authored scaffolds / success criteria | Sparse on most challenges |
| Misconception targets on content rows | Evidence-side only today |
| Per-content accessibility metadata | User persona hooks only |
| Interactive sim/lab runtimes | Rubric text; no state-machine UI |
| Stock/trading education pack | **Zero** trading-specific content (explicitly tracked) |
| Specialized engines (3D, speaking, math workspace) | Correctly deferred |

**Recommendation:** Proceed with **domain content packs** on the existing spine. Add only lightweight metadata (optional misconception tags, accessibility hints) when a pack needs them — not a new CMS or subject enum.

---

## 2. Current content architecture audit

### Universal (cross-domain, cross-activity)

| Concern | Module | Notes |
|---------|--------|-------|
| Concept atom | `knowledge/concept.ts`, Prisma `Concept` | Canonical mastery anchor |
| Content identity | `activities/content-contract.ts` | `contentId`, objective, task, domainContext, conceptHints |
| Content selection | `selectActivityContent` | Deterministic; not Orchestrator |
| Progression | `content-progression/*` | `contentKey`, stage, difficulty, contextVariant, contentVersion |
| Coverage | `content-coverage/*` | AVAILABLE / MISSING / INCOMPATIBLE / UNAVAILABLE |
| Experience | `experience/*` | Projection only |
| Scaffolding | `scaffolding/*` | HINT/STEP/EXAMPLE/CHECKLIST/CONSTRAINT |
| Pipeline | `content-pipeline/*` | Source → objective → prepare → validate |
| Evidence → mastery | `evidence/*`, `mastery/*` | Single spine |
| Orchestrator | `orchestrator/*` | Single decision engine |
| subjectDomain | free-form strings | On Concept, tutor context, compatibility — **not an enum** |

### Activity-specific (mechanism layer)

| Activity | Content storage | Evaluation | Adaptive-ready |
|----------|-----------------|------------|----------------|
| Coding | `activities/coding/challenges.ts` (5) | execution / structural | Yes |
| SQL | `activities/sql/challenges.ts` (2) | sqljs | Yes |
| Lab / Sim / Writing / Project / Presentation / Game | `activities/structured/service.ts` (17) | rubric | Lab/Sim/Pres yes; Writing/Game/Project product-only |
| Quiz / Flashcard | DB-backed items + LearningObject | assessment adapters | Own Adaptive path |
| SIX | technique guides + study_evaluate | pass-gated | Own Adaptive path |
| Tutor | context adapters | authorized evidence only | Not Adaptive-selected |
| LUCKY | retention items | lucky_retention_review | Downstream only |
| CORE | notes/canvas | **no evidence** (intentional) | CTA → Adaptive |

### Domain-specific (content only — not engines)

Implemented via `domainTag` + `conceptHints` + progression `contextVariant`:

- **computer science:** Coding (JS/Python/Java), SQL
- **networking:** lab-network-connectivity, sim-network-fault
- **chemistry:** lab-observe-density
- **electrical:** lab-circuit-fault
- **nursing:** sim-patient-triage
- **business:** sim-supply-demand, write-business-proposal, project-business-plan
- **automotive:** sim-vehicle-diagnostic
- **history:** presentation-history-sources
- **english:** write-explain-photosynthesis

### Reusable

- `UniversalActivityContentDescriptor` projection from any catalog row
- `ContentProgressionEntry` for multi-stage / multi-variant ladders
- `PreparedLearningContent` for source-grounded publishing
- `LearningExperienceView` for any resolved content
- Quiz/Flashcard/SIX/Tutor consume **any** Concept title/domain

### Duplicated (acceptable, not a second system)

| Duplication | Why acceptable |
|-------------|----------------|
| `contentId` in catalog + referenced from progression | Progression is index; catalog is mechanism template |
| Objective on progression entry + catalog descriptor | Progression may paraphrase stage-specific objective |
| TopicMastery + ConceptMastery | Legacy compatibility (TopicMastery not canonical) |
| Assessment items vs UA catalogs | By design — assessment spine separate |

### Missing (meaningful gaps)

1. **Content-authored misconception targets** (orchestrator uses evidence signals instead)
2. **Per-content accessibility metadata** (contrast, alt text, reading level)
3. **Explicit prerequisite links on content rows** (ConceptRelationship + Orchestrator hints instead)
4. **Duplicate contentKey guard at authoring time** (audit helper added; no runtime CMS)
5. **Catalog depth** across most domains (product gap, not architecture)
6. **Chart/equation/map/3D as first-class content fields** (need specialized engine or future content extensions)
7. **VALIDATE as explicit persisted status** (mapped conceptually in 2P-15 lifecycle helper)

---

## 3. Canonical content contract assessment

Future content object fields vs reality (`assessAuthoringContractFields()`):

| Field | Status | Location |
|-------|--------|----------|
| identity | EXISTING | contentId, contentKey, preparationId |
| concept | EXISTING | Concept row + conceptKey |
| learning objective | EXISTING | descriptor.objective |
| activity type | EXISTING | activityKind |
| domain/context | EXISTING | domainTag / subjectDomain |
| stage | EXISTING | LearningContentStage |
| difficulty | EXISTING | ContentDifficulty 1–5 |
| variant | EXISTING | contextVariant, contentVersion |
| instructions / task | EXISTING | prompt → experience.instructions |
| expected artifact/action | EXISTING | expectedAction + evaluationMode |
| scaffolds / hints | PARTIAL | 2P-12; sparse authored |
| success criteria | PARTIAL | rubric + successLooksLike |
| evaluation/rubric | EXISTING | execution/structural/sqljs/rubric |
| evidence mapping | EXISTING | submit → facet |
| prerequisites | ORCHESTRATOR_OWNED | ConceptRelationship |
| misconceptions | PARTIAL | evidence only |
| source/reference | PARTIAL | ContentSourceRef, CORE bridge |
| version | EXISTING | contentVersion |
| availability | EXISTING | coverage + lifecycle |
| ownership | EXISTING | authorship, assertOwnedConcept |
| accessibility metadata | MISSING | user-level hooks only |

**Conclusion:** Contract is **sufficient for scale**. Gaps are **optional metadata**, not structural blockers. Do not add a second content schema — extend catalog row optional fields when needed.

---

## 4. Content pack model

Conceptual packaging reuses existing layers (see `content-production/pack-model.ts` design-time descriptors):

```
DOMAIN / CONTENT PACK
  → CONCEPTS (Concept rows + conceptKey)
  → CONTENT OBJECTS (2P-7 catalog contentId)
  → ACTIVITIES (mechanism)
  → VARIANTS (progression contentKey + contextVariant)
  → PROGRESSION (2P-9 entries)
  → EVALUATION (intrinsic to catalog + rubric)
```

### Finance / Trading Education (fake money — NOT brokerage)

| Layer | Plan |
|-------|------|
| Concepts | market orders, limit orders, risk, diversification, technical indicators |
| Content | scenario narratives, decision prompts, chart descriptions (text-first) |
| Activities | Simulation, Quiz, Project, SIX, Tutor |
| Variants | bull/bear market, sector rotation, earnings shock |
| Evaluation | rubric decision quality + Quiz recognition |
| Engine | **Simulation content only** — no order routing, no real money |

### Java / CS

| Layer | Plan |
|-------|------|
| Concepts | inheritance, collections, exceptions, … |
| Content | coding challenges per language |
| Activities | Coding, Quiz, SIX, Project |
| Progression | **exists** (`CS_INHERITANCE_ENTRIES`) — thin depth |

### Nursing

| Layer | Plan |
|-------|------|
| Concepts | clinical decision making, triage, medication safety |
| Content | sim-patient-triage pattern extended |
| Activities | Simulation, Lab, Quiz, Flashcard, SIX |
| Progression | **exists** (`NURSING_CLINICAL_ENTRIES`) — fixture depth |

### Electrical

| Layer | Plan |
|-------|------|
| Concepts | circuit fault diagnosis, measurement procedure |
| Content | lab-circuit-fault pattern |
| Activities | Lab, Simulation, SIX, Quiz |
| Progression | **exists** (`ELECTRICAL_CIRCUIT_ENTRIES`) |

### History

| Layer | Plan |
|-------|------|
| Concepts | source analysis, historical argument |
| Content | presentation-history-sources, writing prompts |
| Activities | Presentation, Writing, Quiz, SIX, Tutor |
| Progression | **not yet** in catalog — pack adds progression entries only |

### Language learning

| Layer | Plan |
|-------|------|
| Concepts | vocabulary, grammar, conversation |
| Content | flashcard/quiz banks + writing prompts |
| Activities | Flashcard, Quiz, Writing, SIX, Tutor |
| Specialized later | speaking/conversation engine (audio I/O) |

**Pack storage:** code-authored TypeScript catalogs + progression arrays (current pattern). Optional future: JSON import **into same types**, not a parallel system.

---

## 5. Variation system

| Variation need | Mechanism | Status |
|----------------|-----------|--------|
| Different examples | Separate catalog rows or contextVariant | **Sufficient** |
| Different numbers | Separate coding/SQL test cases | **Sufficient** |
| Different scenarios | contextVariant + sim/lab prompts | **Sufficient** |
| Different difficulty | ContentDifficulty 1–5 + ranked selection | **Sufficient** |
| Different contexts | contextVariant + domainTag | **Sufficient** |
| Different misconceptions | **Missing on content**; evidence hints partial | Add optional `misconceptionTargets[]` later |
| Failure variation | `excludeContentKeys` in progression/coverage | **Sufficient** |
| Success / transfer variation | `avoidContextVariant` | **Sufficient** |
| contentKey stability | Stable across retries/Adaptive | **Closed** |
| contentVersion | Lightweight string | **Closed** |

No second variation system required. AI-generated variants should enter as **new catalog rows + progression entries** after validation.

---

## 6. Authoring readiness

Future human authoring can express:

```yaml
Concept: "Java inheritance"
Objective: "Apply inheritance to reuse superclass behavior"
Activity: Coding
Stage: APPLY
Difficulty: 3
Task: ...
Scaffolds: ...
Success criteria: ...
Evaluation: structural / execution
Evidence facet: PERFORM
```

**Mapping today:**

1. Author Concept (or confirm via CORE bridge)
2. Add/update catalog row in `coding/challenges.ts` (or structured/sql)
3. Add `ContentProgressionEntry` in progression catalog (or generated from pack script)
4. Run `prepareLearningContent` + `validatePreparedLearningContent`
5. Optional `publish: true` → PUBLISHED pipeline status
6. Coverage confirms AVAILABLE before Adaptive launch

**No CMS required** for next phases — typed catalogs + validation suffice. A future CMS would emit the same types.

---

## 7. AI-generation readiness

**Safe entry point (added):** `validateAiContentCandidate()` → wraps `runContentPipeline()`.

```
AI generates candidate JSON/text
  ↓ validateAiContentCandidate (2P-15)
  ↓ prepareLearningContent (2P-8)
  ↓ validate objective / concept / capability / catalog contentId
  ↓ human confirm (confirmed: true)
  ↓ READY / PUBLISHED candidate
  ↓ (separate human step) merge into catalog modules
  ↓ learner launch → evaluate → evidence → ConceptMastery
```

**AI MUST NOT:** write ConceptMastery, LearningAttempt, evidence, mastery scores, or learner progress. Pipeline truth summaries enforce this architecturally.

**Not implemented in 2P-15:** LLM generation, embedding retrieval, auto-merge to catalog.

---

## 8. Validation / quality readiness

### Already detected (2P-8 + 2P-7 tests)

- missing / generic objectives
- missing catalog contentId
- unknown contentId
- capability incompatibility
- foreign source / concept ownership
- unconfirmed DRAFT
- missing evaluation mode
- malformed scaffolds (normalize drops)

### Added in 2P-15 (`auditCatalogIntegrity`)

- duplicate contentKey in progression catalog
- duplicate contentId within activity kind
- missing task on descriptor
- missing rubric criteria on structured challenges
- progression contentId not in catalog

### Not required yet

- JSON Schema for entire pack (TypeScript types suffice)
- Semantic domain validation (free-form domainTag intentional)
- Automated prerequisite graph validation on content rows

---

## 9. Content density matrix

Live-derived snapshot (`buildContentDensityMatrix()`):

| Domain | Activity | Existing content | Depth | Major gap |
|--------|----------|------------------|-------|-----------|
| Java / CS | Coding | 2 Java + 3 JS/Py catalog; 5 progression entries | THIN | Single inheritance challenge; no OOP ladder |
| SQL | SQL | 2 challenges; 2 progression variants | THIN | No JOIN/aggregate packs |
| Networking | Lab + Simulation | 1 lab + 1 sim; 4 progression entries | FIXTURE | Text rubric; no topology UI |
| Nursing / Clinical | Simulation | 1 sim; 2 progression entries | FIXTURE | One triage scenario |
| Finance / Business | Simulation | 1 supply/demand sim; 4 progression entries | FIXTURE | **No stock/trading pack** |
| Electrical / Trades | Lab | 1 lab; 2 progression entries | FIXTURE | No equipment UI |
| History / Humanities | Presentation + Writing | 1 + 2 fixtures | FIXTURE | No source progression ladder |
| Language learning | Flashcard + Quiz | Product-deep engines | THIN | No speaking engine |
| **Stock Market / Trading (edu)** | Simulation (planned) | **0 trading-specific** | **NONE** | Fake-money pack not authored |
| Cybersecurity | Simulation + Lab | 0 dedicated | NONE | Start with scenario content |

Quiz/Flashcard/SIX have **DEEP product** depth globally but are not domain-pack enumerated here.

---

## 10. Domain generalization audit

**Proven:** same mechanism + different `domainTag` / prompts:

| Mechanism | Domains demonstrated in catalog |
|-----------|--------------------------------|
| Coding | JS, Python, Java (computer science tag) |
| SQL | computer science |
| Lab | chemistry, networking, electrical |
| Simulation | business, nursing, networking, automotive |
| Writing | english, business |
| Project | computer science, business |
| Presentation | history, technical |
| Game | biology vocab, networking terms |
| Quiz / Flashcard / SIX / Tutor | **Any** Concept (domain in item/context) |

Orchestrator selects **mechanism** from diagnosis + capability; content layer supplies **domain body**. Confirmed by `universal-activity-domain-generalization.test.ts` and 2P-7 fixtures.

---

## 11. Specialized content vs specialized engine

| Experience | Content (A/B/C) | Engine (D) | Decision |
|------------|-----------------|------------|----------|
| Stock-market scenario | C — Simulation rubric | — | Content first; chart UI optional later |
| Nursing medication case | C — Sim/Lab/Quiz | Dosage calc maybe D later | Content first |
| Java coding challenge | C — Coding catalog | — | Universal |
| Anatomy 3D model | — | D — 3D runtime | Specialized when interaction requires 3D |
| Language pronunciation | — | D — audio/speech | Specialized |
| Electrical troubleshooting | C — Lab/Sim text | D if virtual multimeter UI required | Start C; upgrade to D if UX demands |
| Cybersecurity sandbox | C then D | Combo | Scenarios first |
| Financial modeling spreadsheet | C — Project prompts | D if grid workspace required | Combo |
| History source analysis | C — Writing/Presentation | Timeline viewer optional D | Content first |
| Music / Art practice | C for theory | D for performance capture | Specialized engines justified |

**Rule:** domain ≠ engine. Prefer **content packs** until universality test fails.

---

## 12. Storage recommendation

| Store | Current use | Future |
|-------|-------------|--------|
| TypeScript catalogs | UA challenges + progression fixtures | Primary for curated packs |
| Prisma DB | Concepts, Quiz, Flashcard, LearningObject, attempts, mastery | Learner-specific + assessment banks |
| CORE notes/materials | Source for pipeline | CORE → bridge → prepared content |
| JSON file packs | Not used | Optional import to same TS types |
| Generated at runtime | **Forbidden** for authoritative content | AI candidates validated offline |

**Hybrid direction:** system packs in repo catalogs; learner/course-specific assessment items in DB; CORE-derived objectives through pipeline. **No CMS/marketplace in near term.**

---

## 13. Content lifecycle

Conceptual phases (2P-15 `resolveContentLifecyclePhase`):

```
DRAFT → VALIDATE → READY → AVAILABLE → RETIRED
```

| Phase | Maps from |
|-------|-----------|
| DRAFT | pipeline DRAFT or progression DRAFT |
| VALIDATE | validation in flight / catalog not resolving |
| READY | pipeline READY or progression READY |
| AVAILABLE | READY + catalog resolves + coverage AVAILABLE |
| RETIRED | ARCHIVED |

Existing pipeline statuses (`DRAFT | READY | PUBLISHED | ARCHIVED`) and progression `readiness` remain unchanged. VALIDATE is **not persisted** — avoids CMS creep.

---

## 14. Content + Learner Model relationship

Content metadata **informs presentation and coverage**, not mastery:

| Metadata | Influences | Must NOT |
|----------|------------|----------|
| difficulty | progression rank, experience label | set ConceptMastery score |
| stage | experience purpose line | replace Orchestrator diagnosis |
| contextVariant | transfer selection | create evidence |
| objective | task clarity, payloadRef | dictate intervention alone |
| activity type | mechanism (Orchestrator-selected) | per-subject loop |
| misconception target (future) | scaffold emphasis | auto-diagnose without evidence |

Preserved flow:

```
Content → Learner interaction → Evidence → ConceptMastery → Orchestrator
```

---

## 15. Content + Adaptive relationship

**Already works:**

- Orchestrator → Adaptive step → activity kind
- `selectProgressionContent` with `excludeContentKeys`, `avoidContextVariant`, stage/difficulty prefs
- `evaluateContentCoverage` before experience projection
- Adaptive bind + concept guard on submit
- Failure variation via excluded content keys when alternatives exist

**Missing (not blockers):**

- Automatic progression of difficulty on repeated SUCCESS (Orchestrator could pass `preferredDifficulty` — wiring optional)
- Writing/Game/Project excluded from Adaptive bind (intentional)
- Rich misconception-targeted variant selection (needs content metadata)

Adaptive must **not** become a second recommendation engine — it consumes Orchestrator intervention + coverage/progression selectors only.

---

## 16. Five-domain scaling test

### Java

| Step | Support | Notes |
|------|---------|-------|
| Concept | ✅ | java-inheritance conceptKey |
| Content | ✅ | java-inheritance-subclass |
| Activity | ✅ | Coding Adaptive-ready |
| Experience | ✅ | resolveLearningExperience |
| Scaffolding | ⚠️ | minimal authored scaffolds |
| Evaluation | ✅ | structural patterns |
| Evidence | ✅ | coding_challenge_submit PERFORM |
| ConceptMastery | ✅ | canonical |
| Orchestrator | ✅ | APPLICATION_GAP → activity |

### Nursing

| Step | Support | Notes |
|------|---------|-------|
| Concept | ✅ | clinical-decision-making |
| Content | ✅ | sim-patient-triage |
| Activity | ✅ | Simulation Adaptive-ready |
| Experience | ✅ | scenario + rubric |
| Evaluation | ✅ | rubric keywords |
| Evidence | ✅ | simulation_challenge_submit |
| Special | ⚠️ | no immersive clinical UI |

### Finance / Stock Market Education

| Step | Support | Notes |
|------|---------|-------|
| Concept | ✅ (free-form) | pack concepts not yet authored |
| Content | ⚠️ | supply/demand sim only; **no trading pack** |
| Activity | ✅ | Simulation mechanism ready |
| Experience | ✅ | projection works when content exists |
| Evaluation | ✅ | rubric |
| Evidence | ✅ | same spine |
| Special | 🚫 | **NO brokerage / real money** — fake scenarios only |

### Electrical

| Step | Support | Notes |
|------|---------|-------|
| Concept | ✅ | circuit-fault-diagnosis |
| Content | ✅ | lab-circuit-fault |
| Activity | ✅ | Lab Adaptive-ready |
| Experience | ✅ | |
| Special | ⚠️ | text lab; virtual equipment = future engine |

### History

| Step | Support | Notes |
|------|---------|-------|
| Concept | ✅ | free-form titles |
| Content | ✅ | presentation-history-sources, writing |
| Activity | ✅ | Presentation Adaptive-ready; Writing product-only |
| Progression | ⚠️ | no history progression ladder yet |
| Special | ⚠️ | primary sources via CORE/materials, not activity-first |

**No domain required a separate learning loop.**

---

## 17. Production strategy

| Stream | Description |
|--------|-------------|
| Foundational universal content | Expand Adaptive-ready catalogs (Coding, SQL, Lab, Sim, Presentation) |
| Domain packs | Group Concepts + progression + catalog rows by packId (design-time model) |
| Activity content | Mechanism-specific templates (starter code, rubric, SQL schema) |
| Specialized engines | Only after universality test fails |
| AI-generated candidates | `validateAiContentCandidate` → human review → merge to catalog |
| Human-authored | TS/JSON → same types |
| Validation | pipeline + catalog integrity audit |
| Publishing | READY/PUBLISHED + progression readiness |
| Versioning | contentVersion strings; bump on material change |
| Retirement | readiness ARCHIVED; exclude from coverage |

**Not in scope:** mass production this phase, CMS, marketplace.

---

## 18. P0 / P1 / P2 / P3 roadmap

### P0 — Content architecture blockers

- ✅ None identified — spine closed
- Preserve: one Orchestrator, one mastery, one evidence, no subject enum, no brokerage

### P1 — Content production readiness (immediate follow-ups)

1. Catalog integrity CI (`auditCatalogIntegrity` in test suite) — **done in 2P-15**
2. Optional `misconceptionTargets` on catalog rows (additive field)
3. Authored scaffolds + successLooksLike on top 20 challenges
4. Pack authoring checklist doc → already in this file

### P2 — First domain/content packs (recommended order by leverage)

| Priority | Pack | Rationale |
|----------|------|-----------|
| 1 | CS/Java + SQL depth | Adaptive-ready; highest reuse; thin catalog |
| 2 | Networking + cybersecurity scenarios | Lab/Sim reuse; adjacent fixtures exist |
| 3 | Educational market/trading (fake money) | Explicit user demand; Simulation-only |
| 4 | Nursing/clinical scenarios | Sim pattern proven |
| 5 | Electrical/trades troubleshooting | Lab pattern proven |
| 6 | History/humanities writing+presentation | Mechanisms ready; needs progression |

### P3 — Advanced / specialized

- Writing Adaptive-ready
- Math workspace engine
- Language speaking engine
- 3D anatomy / CAD / music / art practice
- Cybersecurity interactive sandbox
- Virtual equipment trainers

### Recommended phase after 2P-15

**2P-16 — Adaptive-ready catalog depth (CS + networking + clinical + market edu + trades)** — content production on closed architecture, not redesign.

Then: **2P-17** trading education pack (fake money), **2P-18** scaffold/success coverage, **2P-19** Writing Adaptive if needed.

---

## 19. Explicit future content backlog

### Future domains / experiences not yet introduced

**Required minimum (from spec):**

- Stock Market / Trading Education (fake money scenarios)
- 3D Anatomy
- Clinical Simulation (immersive)
- Electrical Troubleshooting (virtual equipment)
- Automotive Diagnostics (deeper than sim-vehicle-diagnostic)
- Cybersecurity (interactive range)
- Language Speaking / Conversation
- Music
- Art / Design
- Advanced Mathematics (symbolic workspace)
- Chemistry (virtual lab runtime)
- Physics (virtual lab runtime)
- Law / Case Analysis
- Geography / Maps
- Entrepreneurship (beyond business plan fixture)
- Financial Modeling (spreadsheet workspace)

**Additional candidates (from 2P-14):**

- NCLEX / nursing item banks
- Network topology builder
- Debate / oral argument with recording
- Medical dosage calculator environment
- CAD / engineering design studio
- Spreadsheet / BI workspace
- Live/delayed market **data feeds for classroom** (still not brokerage)
- Virtual HVAC / multimeter trainers
- Public speaking with recording
- Coding interview timed UX

---

## 20. Architecture safety verification

| Rule | Status |
|------|--------|
| NO second content system | ✅ `content-production` reuses 2P-7→12 |
| NO second Orchestrator | ✅ selectors explicitly not Orchestrator |
| NO second Learner Model | ✅ no new model code |
| NO second Evidence system | ✅ production modules ban mastery imports |
| NO second mastery system | ✅ ConceptMastery canonical |
| NO giant subject enum | ✅ free-form domainTag/subjectDomain |
| NO per-subject learning loop | ✅ |
| NO real-money trading infrastructure | ✅ explicit in pack model + truth summary |
| NO CMS (this phase) | ✅ |
| NO mass AI generation | ✅ wrapper only |
| NO removal of existing paths | ✅ additive only |
| CORE → SIX → LUCKY preserved | ✅ |
| ACTIVITY COMPLETION ≠ SUCCESS ≠ MASTERY | ✅ 2P-13 intact |

---

## Verification (2P-15)

Run:

```bash
npm test -- src/lib/learning/content-production
npm test -- src/lib/learning/content-pipeline
npm test -- src/lib/learning/content-progression
npm test -- src/lib/learning/content-coverage
npm test -- src/lib/learning/experience
npm test -- src/lib/learning/scaffolding
npm test -- src/lib/learning/activities/universal-content-contract.test.ts
npm test -- src/lib/learning
npx eslint src/lib/learning/content-production src/lib/learning/index.ts
npx tsc --noEmit
```

Browser E2E: **no harness** (documented limitation from 2P-14).

---

## Files touched in 2P-15

| Path | Role |
|------|------|
| `UNIVERSAL_CONTENT_PRODUCTION_READINESS.md` | This report |
| `content-production/types.ts` | Design types |
| `content-production/lifecycle.ts` | Lifecycle projection |
| `content-production/catalog-integrity.ts` | Integrity audit |
| `content-production/ai-candidate.ts` | AI-safe validation entry |
| `content-production/density-matrix.ts` | Density matrix builder |
| `content-production/pack-model.ts` | Design-time pack descriptors |
| `content-production/authoring-contract.ts` | Field assessment |
| `content-production/index.ts` | Barrel exports |
| `content-production/content-production.test.ts` | Tests |
| `index.ts` | Public exports |

**Intentionally not done:** mass content, trading simulator UI, new engines, CMS, Prisma content tables.
