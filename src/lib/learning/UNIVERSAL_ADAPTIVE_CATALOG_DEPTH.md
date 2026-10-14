# Universal Adaptive Catalog Depth (2P-16)

> **Small, real Adaptive-ready seed catalog** across substantially different domains — proving the closed 2P-7→2P-15 spine can carry meaningful learning content without subject engines, CMS, Prisma content tables, or mass generation.

**Architecture preserved:** CORE → SIX → LUCKY · one Orchestrator · one ConceptMastery · one Evidence spine · free-form `subjectDomain`.

**Related:** `UNIVERSAL_CONTENT_PRODUCTION_READINESS.md` (2P-15) · `UNIVERSAL_PRODUCT_EXPANSION_MAP.md` (2P-14)

---

## 1. Objective

Prove that Study Haul can host **high-quality, Adaptive-ready universal catalog depth** across CS, networking, nursing, finance (fake-money trading education), trades, history, and math/science — using only additive catalog + progression rows.

---

## 2. Existing architecture reused

| Layer | Module |
|-------|--------|
| Content contract | `activities/content-contract.ts` |
| Coding / SQL / Structured catalogs | `activities/coding`, `sql`, `structured` |
| Pipeline | `content-pipeline/*` |
| Progression / variation | `content-progression/*` |
| Coverage / availability | `content-coverage/*` |
| Experience / scaffolding | `experience/*`, `scaffolding/*` |
| Production helpers | `content-production/*` (2P-15 + 2P-16) |
| Adaptive bind | `sequence/activity-adaptive-completion.ts` |
| Evidence → mastery | existing submit paths |

**No second content system.** Seed registry only points at catalog `contentId`s.

---

## 3. Catalog seed strategy

- **Small by design** (~19 seed items; &lt;40 hard cap in tests)
- Prefer enriching Adaptive-ready mechanisms: Coding, SQL, Lab, Simulation, Presentation
- Writing items included for history/math quality but **not** forced Adaptive-ready
- Every new item: meaningful objective, concrete task, evaluation, scaffolds, optional misconception/accessibility enrichment
- Educational market item: **fake money / paper portfolio only** (`realMoney: false`, `brokerage: false`)

Helpers:

- `content-production/seed-catalog.ts` — seed registry
- `content-production/adaptive-ready-contract.ts` — depth contract assessment
- `content-production/enrichment.ts` — optional misconception + accessibility types
- `buildAdaptiveCatalogDepthMatrix()` — live-derived density

---

## 4. Domain coverage

| Domain family | Seed examples |
|---------------|---------------|
| Computer Science | Java inheritance, Java exceptions, JS debugging, SQL filter, SQL JOIN |
| Networking | Connectivity lab, network fault sim, DNS misconfig sim |
| Nursing | Patient triage, clinical prioritization |
| Finance | Supply/demand, **market order edu (fake money)** |
| Electrical | Circuit fault lab |
| Automotive | Vehicle diagnostic sim |
| History | Source presentation, cause/effect writing |
| Math/Science | Proportional reasoning writing, physics force lab, chemistry density lab |

---

## 5. Activity coverage

| Activity | Seed use | Adaptive-ready mechanism? |
|----------|----------|---------------------------|
| Coding | inheritance, exceptions, debug | Yes |
| SQL | filter, join | Yes |
| Lab | network, circuit, physics, chemistry | Yes |
| Simulation | nursing×2, networking×2, finance×2, automotive | Yes |
| Presentation | history sources | Yes |
| Writing | history cause/effect, math proportion | **No** (product-ready only) |
| Quiz / Flashcard / SIX / Tutor | Not expanded this phase (already deep products) | Own paths |

---

## 6. Adaptive-ready definition

A seed is **`adaptiveReadySeed`** when:

1. Mechanism is Adaptive-bind ready (`coding|sql|lab|simulation|presentation`)
2. Catalog contract complete (objective, task, evaluationMode)
3. At least one READY progression entry references the `contentId`

**Recommended (not required for the flag):** scaffolds, `successLooksLike`, misconception targets, accessibility meta.

Writing/Game/Project remain product-ready and are **not** forced into Adaptive.

---

## 7. Content quality contract

### Required universally

`contentId`, meaningful `objective`, `task`, `activityKind`, `evaluationMode`, concept alignment via hints or explicit id.

### Required by activity

| Kind | Extras |
|------|--------|
| Coding | starter, entryFunction, tests or requiredPatterns |
| SQL | seedSql, expectedRows, starter |
| Structured | rubric criteria, minChars |

### Recommended domain metadata

`domainTag`, stage, difficulty, `contextVariant`, scaffolds, `successLooksLike`

### Optional enrichment (2P-16)

`misconceptionTargets[]`, `accessibility` (`altDescription`, `reducedComplexity`, `extendedTimeSuggested`, `interactionNote`)

---

## 8. Variation strategy

Uses existing 2P-9 selectors only:

- Multiple stages per concept (e.g. `market-orders` UNDERSTAND/APPLY/CHALLENGE)
- `contextVariant` differences (e.g. urgency vs paper portfolio)
- `excludeContentKeys` failure variation
- `avoidContextVariant` transfer variation
- Same `contentId` reusable across stage entries (challenge vs apply)

---

## 9. Density matrix

Live-derived via `buildAdaptiveCatalogDepthMatrix()` (captured at verification):

| Domain | Concepts | Content | Activity Types | Adaptive Ready | Depth | Gaps |
|--------|---------:|--------:|----------------|---------------:|-------|------|
| Computer Science | 5 | 5 | Coding/SQL | 5 | MODERATE | Still thin OOP ladder; limited languages |
| Networking | 2 | 3 | Simulation/Lab | 3 | MODERATE | Text rubric only; no topology UI |
| Nursing | 2 | 2 | Simulation | 2 | THIN | No pharmacology/med-admin packs |
| Finance | 2 | 2 | Simulation | 2 | THIN | Fake-money only; no chart workspace |
| Electrical | 1 | 1 | Simulation/Lab | 1 | FIXTURE | No virtual multimeter UI |
| Automotive | 1 | 1 | Simulation | 1 | FIXTURE | Single diagnostic scenario |
| History | 1 | 2 | Writing/Presentation | 1 | THIN | Writing not Adaptive-ready; no timeline UI |
| Math/Science | 3 | 3 | Lab/Writing | 2 | MODERATE | No symbolic math engine; chemistry still thin |

Seed registry: **19** items · **17** Adaptive-ready seeds (Writing seeds intentionally excluded from Adaptive bind).

Trading education moved from **NONE** (2P-15) to seeded **fake-money Simulation**.

---

## 10. Cross-domain validation

Tests assert:

- No `if (subject === …) useXEngine()` in content-production
- Domain alone does not select intervention (`selectActivityIntervention` still null without full policy context)
- Concept-hint matching selects Coding / Simulation / Lab mechanisms
- Same Simulation mechanism serves nursing, finance, networking, automotive

---

## 11. Evidence / mastery validation

- Coding debug seed: starter fails; fixed code SUCCESS + PERFORM
- Simulation prioritization: stub fails; rubric SUCCESS carries `contentId`
- Evidence path unchanged: submit → server evaluation → LearningAttempt → ConceptMastery
- Content itself is never authoritative evidence

---

## 12. Adaptive validation

- Adaptive-ready seeds: `adaptiveReadySeed === true`
- Writing seeds: `mechanismAdaptiveReady === false`
- Coverage AVAILABLE for `market-orders` → `sim-market-order-edu`
- Experience projection includes scaffolds for exception coding seed
- Launch ≠ completion / client forge rules unchanged (existing Adaptive tests)

---

## 13. AI candidate safety

`validateAiContentCandidate` still wraps `runContentPipeline`:

- Unconfirmed → fails `unconfirmed`
- Confirmed → prepared content only
- `doesNotWriteMastery` / `doesNotWriteEvidence`
- No mass generation

---

## 14. Human authoring readiness

**Yes — for universal contracts:**

1. Add catalog row to `coding/challenges.ts`, `sql/challenges.ts`, or `structured/service.ts`
2. Add `ContentProgressionEntry` in `content-progression/catalog.ts`
3. Optional: enrichment fields + scaffolds
4. Run `auditCatalogIntegrity` / seed tests
5. Optional: `prepareLearningContent` / `validateAiContentCandidate` for candidates

No CMS required. No new learning system required when the mechanism already exists.

---

## 15. Accessibility readiness

Additive optional `ContentAccessibilityMeta` on seed rows + existing user persona hooks.

Not mandatory. Does not create a separate accessibility content system.

---

## 16. Content gaps

- Broader OOP / data-structures coding ladder
- SQL aggregates / multi-domain datasets
- Nursing pharmacology / med-admin scenarios
- History source banks + timeline content
- Cybersecurity dedicated scenarios (still none)
- Language-speaking content (needs engine)

---

## 17. Evaluation gaps

- Lab/Sim remain keyword rubrics (not instrumented runtimes)
- Java structural evaluation (not full JVM)
- Math writing rubric ≠ CAS step checking

---

## 18. Activity gaps

- Writing / Game / Project: product-ready, not Adaptive-ready (intentional)
- Quiz/Flashcard: deep but not expanded as UA seed rows this phase

---

## 19. Engine-gap analysis

| Experience | Universal enough? | Missing interaction |
|------------|-------------------|---------------------|
| Educational market/trading | **Yes** (Simulation content) | Chart UI optional later; **never brokerage** |
| Clinical prioritization | **Yes** (Simulation) | Immersive vitals UI later |
| Electrical troubleshooting | **Yes** (Lab text) | Virtual multimeter → specialized |
| Automotive diagnostics | **Yes** (Simulation) | Deeper shop UI later |
| 3D anatomy | **No** | 3D runtime |
| Language speaking | **No** | Audio I/O |
| Advanced mathematics | **Partial** (writing/quiz) | Symbolic workspace |
| Chemistry/physics labs | **Partial** (rubric Lab) | Interactive experiment runtime |
| Cybersecurity sandbox | **Partial** (sim scenarios) | Interactive range |
| CAD / music / art | **No** | Domain practice engines |
| Geography/maps | **Partial** (quiz/sim text) | Map interaction |
| Law/case analysis | **Yes** (Writing/Sim/Presentation) | — |
| Entrepreneurship | **Yes** (Sim/Project) | — |
| Financial modeling | **Partial** (Project prompts) | Spreadsheet workspace |

---

## 20. Recommended production strategy

1. Grow Adaptive-ready catalogs first (Coding/SQL/Lab/Sim/Presentation)
2. Author packs as progression + catalog pairs
3. Enrich scaffolds/misconceptions/accessibility on high-traffic items
4. Keep Writing Adaptive as a separate explicit phase
5. Specialized engines only after universality test fails

---

## 21. P0 / P1 / P2 / P3 backlog

### P0

- Preserve spine integrity; no brokerage; no subject enum

### P1

- Expand CS + networking Adaptive catalog depth
- Enrich scaffolds on remaining thin Adaptive fixtures
- Nursing scenario pack (still Simulation)

### P2

- Fake-money trading pack expansion (charts as content, not brokerage)
- History Adaptive path via Presentation + Assessment banks
- Writing Adaptive-ready (explicit phase)

### P3

- Math workspace, language speaking, 3D anatomy, virtual equipment, cybersecurity range

---

## 22. Explicit future domains / experiences

Not introduced as products this phase (still tracked):

Stock Market deeper packs · 3D Anatomy · Clinical Simulation (immersive) · Electrical virtual equipment · Automotive shop UI · Cybersecurity range · Language Speaking · Music · Art/Design · Advanced Mathematics workspace · Chemistry/Physics interactive labs · Law case packs · Geography/Maps · Entrepreneurship packs · Financial Modeling spreadsheet · CAD · Debate/oral with recording · NCLEX banks · Live classroom market data feeds (still not brokerage)

---

## 23. Architecture safety rules

| Rule | Status |
|------|--------|
| No second content system | ✅ seed registry only |
| No second Orchestrator / Learner Model / Evidence / Mastery | ✅ |
| No subject enum / per-subject loop | ✅ |
| No Prisma content tables / CMS | ✅ |
| No mass AI generation | ✅ |
| No real-money trading | ✅ |
| No premature specialized engines | ✅ |
| CORE → SIX → LUCKY preserved | ✅ |
| Completion ≠ success ≠ mastery | ✅ |
| Existing UX/routes intact | ✅ additive catalogs only |

---

## Files (2P-16)

| Path | Change |
|------|--------|
| `UNIVERSAL_ADAPTIVE_CATALOG_DEPTH.md` | This report |
| `content-production/enrichment.ts` | Optional metadata types |
| `content-production/adaptive-ready-contract.ts` | Depth contract |
| `content-production/seed-catalog.ts` | Seed registry |
| `content-production/density-matrix.ts` | Live matrices |
| `content-production/adaptive-catalog-depth.test.ts` | Focused tests |
| `content-production/authoring-contract.ts` | Accessibility → PARTIAL |
| `content-production/index.ts` / `learning/index.ts` | Exports |
| `activities/coding/challenges.ts` | +exception, +debug seeds |
| `activities/sql/challenges.ts` | +JOIN seed |
| `activities/structured/service.ts` | +market, nursing priority, history, math, physics, DNS |
| `content-progression/catalog.ts` | Progression ladders for seeds |
| Existing contract tests | Domain set expectations updated |

**Intentionally not done:** CMS, Prisma content tables, specialized engines, brokerage, mass content, Writing Adaptive bind.
