# Universal Learning Product Expansion Map (2P-14)

> **Inspection + design only.** This phase does not implement new activity engines, domains, UI systems, or database tables. It inventories what exists, what is missing, and what to build next — without creating a second learning system.

**Closed foundation:** 2G architecture + 2P-1 → 2P-13 (including outcome integrity: **ACTIVITY COMPLETION ≠ SUCCESS ≠ MASTERY**).

**Permanent architecture:** CORE → SIX → LUCKY · one Orchestrator · one ConceptMastery · one Evidence spine · free-form `subjectDomain` (no giant subject enum).

---

## 1. Executive summary

Study Haul already has a **closed Universal Learning Engine loop** for several Adaptive-ready activities (Coding, SQL, Lab, Simulation, Presentation) plus deep Assessment (Quiz/Flashcard), SIX, LUCKY retention, and CORE authoring.

What is *not* finished is **product breadth**:

| Gap class | Reality |
|-----------|---------|
| Activity **depth** | Catalogs are small; many “labs/sims” are rubric text, not interactive runtimes |
| Activity **coverage** | Writing / Game / Project are product-ready but not Adaptive-ready |
| **Domains** | Free-form domains work; content fixtures cover only a handful of concept keys |
| **Specialized engines** | Justified for math workspace, language speaking, 3D/anatomy, CAD, music/art, virtual equipment — **not** for every subject |
| **Educational market/trading** | Represent as **content + Simulation** (fake money / scenarios) — **never** a brokerage |

**Recommended next build sequence (high level):** deepen Adaptive-ready content & experience quality → optionally Adaptive-ready Writing/Project → educational domain content packs (health, trades, business/market) on existing engines → then specialized engines only where universals fail the universality test.

---

## 2. Current activity engine maturity

Maturity bands: **FOUNDATION** · **PRODUCT-READY** · **ADAPTIVE-READY** · **DEEP/PRODUCTION**

| Engine | Maturity | Evidence | Facets | Adaptive | Assessment | Depth still missing | Action |
|--------|----------|----------|--------|----------|------------|---------------------|--------|
| **Coding** | ADAPTIVE-READY | `coding_challenge_submit` | PERFORM | Universal bind | Opt-in adapter | Small catalog; Py/Java structural-only | **Enhance** content + language depth |
| **SQL** | ADAPTIVE-READY | `sql_challenge_submit` | PERFORM | Universal bind | Opt-in adapter | ~2 challenges | **Enhance** catalog |
| **Lab** | ADAPTIVE-READY | `lab_challenge_submit` | PERFORM | Universal bind | Via activity/Adaptive | Rubric text ≠ instrumented lab | **Enhance** scenarios; defer runtime |
| **Simulation** | ADAPTIVE-READY | `simulation_challenge_submit` | APPLY / SOLVE | Universal bind | Via activity/Adaptive | Text scenarios; no state machine UI | **Enhance** content; specialized later if needed |
| **Presentation** | ADAPTIVE-READY | `presentation_challenge_submit` | PERFORM | Universal bind | Via activity/Adaptive | Outline only; no speech/video | **Enhance** lightly; speech = specialized later |
| **Writing** | PRODUCT-READY + **Adaptive-ready (2P-18)** | structured submit | EXPLAIN | Adaptive bind | Writing assess adapter | Universal Adaptive loop closed | Maintain |

| **Project** | PRODUCT-READY | structured submit | APPLY | **Not** Adaptive | — | Rubric plans; no multi-step workspace | **Enhance** later |
| **Game** | PRODUCT-READY | structured submit | RECOGNIZE | **Not** Adaptive; not auto-selected | — | Text match games | Leave or light UX; not priority |
| **Quiz** | DEEP/PRODUCTION | `quiz_attempt` | RECOGNIZE | Own Adaptive path | Canonical ASSESS | By design assessment_only | **Leave** spine; grow content |
| **Flashcard** | DEEP/PRODUCTION | `flashcard_review` | RETAIN | Own Adaptive path | ASSESS / PRACTICE_CHECK | topicId coupling | **Leave** spine; grow content |
| **SIX** | DEEP/PRODUCTION | `study_evaluate` | varies | Own Adaptive path (pass-gated) | Separate from ASSESS | Hands-on ≠ live PERFORM | **Leave** (first-class) |
| **Tutor** | PRODUCT-READY* | authorized only | EXPLAIN/APPLY/SOLVE | Not Adaptive | — | Auth gates; not orchestrated | **Leave**; careful evidence |
| **LUCKY** | DEEP retention | `lucky_retention_review` | RETAIN | Downstream handoff only | Mixes study modes | Not an intervention | **Leave** |
| **CORE** | DEEP authoring | **none** (intentional) | — | CTA → Adaptive | Assist only | N/A | **Leave** |
| **Adaptive** | DEEP engine | binds attempts; never fabricates | — | Self | ASSESS handoff | Content breadth | **Leave** engine; feed content |

\*Public Tutor chat intentionally outside evidence.

### Additional mechanisms already in repo (not in the “universal eight”)

| Mechanism | Role | Maturity | Notes |
|-----------|------|----------|-------|
| Blurting | Active recall | DEEP study product | `study_evaluate` / RETAIN |
| Teach Me | Feynman explain | DEEP study product | Optional unified Tutor flag |
| Mixed Review | Combo planner surface | PRODUCT-READY | Not a separate CLOSED producer |
| Legacy `/study/practice` | Code + TopicMastery | LEGACY | Prefer ULE Coding |
| Grade School | Parallel progress track | PRODUCT parallel | **Not** ConceptMastery spine |
| Assignments practice | Direct coding deep-link | Surface shortcut | DIRECT_ACTIVITY |
| Sessions / telemetry / break-down | Support | Support | Not primary mastery |

---

## 3. Missing / future activity engines

Classify candidates: **A** existing engine · **B** new specialized engine · **C** content in existing · **D** combination.

| Candidate | Class | Why |
|-----------|-------|-----|
| Market / Trading (educational, fake money) | **C** → Simulation (+ Quiz/Project/Tutor/SIX) | Scenarios + decisions fit Simulation; charts may later need combo. **Not a brokerage.** |
| Clinical scenario | **C** → Simulation (+ Lab/Quiz) | Already have patient-triage fixture pattern |
| Automotive diagnostics | **C** → Simulation (+ Lab) | `sim-vehicle-diagnostic` pattern |
| Circuit / electrical troubleshoot | **C** → Lab / Simulation | Existing circuit fixtures |
| Case-study decision | **C** → Simulation / Writing / Project | Decision + write-up |
| Entrepreneurship / business sim | **C** → Simulation + Project | Supply/demand + business plan exist |
| Network topology simulator | **D** | Start as Simulation content; true topology UI → B later |
| Cybersecurity sandbox | **D** | Scenarios in Simulation first; interactive sandbox → B |
| Chemistry / physics experiment | **D** | Rubric Lab first; interactive experiment → B |
| Medical dosage / calculation | **D** | Quiz + Tutoring + constrained calc; dedicated dosage engine only if needed |
| Financial modeling | **D** | Project + Spreadsheet-like workspace later (B if grid UX required) |
| Historical / source analysis | **D** | Presentation/Writing + reading content; timeline UX optional |
| Debate / oral argument | **D** | Writing/Presentation first; speech capture → B |
| Geography / map | **D** | Quiz/Simulation content; map interaction → B |
| Mathematics workspace | **B** | Equations, step checking, CAS-like UX not served by Coding/Quiz alone |
| Language conversation / speaking | **B** | Audio I/O, pronunciation, dialogue state |
| Music practice | **B** | Pitch/rhythm capture |
| Art / drawing practice | **B** | Canvas + rubric beyond CORE ink |
| 3D spatial / anatomy | **B** | 3D runtime |
| CAD / spatial design | **B** | Design tool surface |
| Engineering design environment | **B** | Multi-constraint design loop |
| Virtual equipment / tool operation | **B** | Device UI simulation |
| Spreadsheet / data analysis workspace | **B** (or D with SQL) | Grid interaction beyond SQL challenges |

**Additional candidates worth tracking:** nursing skills checklists (C→Lab), NCLEX-style adaptive items (A→Quiz), coding interviews (A→Coding), language reading (A→Quiz/Flashcard/Writing), public speaking with recording (B), lab safety procedures (C→Lab).

---

## 4. Universal domain inventory

Domains are **content + free-form `subjectDomain` strings**, not enums. Below is a planning inventory (not code).

### STEM
Mathematics, Algebra, Geometry, Calculus, Statistics, Biology, Chemistry, Physics, Earth Science, Environmental Science, Astronomy.

### Computer science / technology
Programming, Software Engineering, Algorithms, Data Structures, Databases, SQL, Web Development, Networking, Cybersecurity, Cloud, IT, Data Analytics, AI/ML, Operating Systems.

### Health
Nursing, NCLEX, Anatomy, Physiology, Pharmacology, Medical Terminology, Clinical Reasoning, Allied Health, Medical Coding, Healthcare Administration.

### Business / finance
Accounting, Finance, Economics, Management, Marketing, Entrepreneurship, Operations, Supply Chain, HR, Business Law, Investing, **Stock Market / Trading (educational)**, Financial Modeling.

### Trades
Electrical, Electronics, Automotive, HVAC, Plumbing, Welding, Construction, Manufacturing, Industrial Maintenance, Mechanical Systems.

### Humanities / social science
History, Government/Civics, Political Science, Psychology, Sociology, Philosophy, Literature, Geography, Anthropology, Law.

### Languages
English, Spanish, French, German, Japanese, Chinese, others.

### Arts / creative
Art, Music, Graphic Design, Photography, Film, Creative Writing, Theater, Public Speaking, Design.

### Education / professional
Teacher Education, Certifications, Test Prep, Workplace Training, Career Skills, Professional Development.

### Overlap / content-vs-engine rules

- **Overlap is OK** (e.g. Nursing ∩ Anatomy ∩ Pharmacology) — Concepts carry titles/domains; engines stay mechanisms.
- Prefer **domain = content packs** on Coding/SQL/Lab/Sim/Quiz/SIX/Tutor until a specialized engine is justified.
- **Do not** create per-subject orchestrators or mastery tables.

### Domains requiring specialized environments (eventual)

Math workspace, spoken language, music, freehand art critique at scale, 3D anatomy, CAD, immersive equipment trainers.

### Domains well-served by existing engines today (with content)

Programming, SQL/databases, networking/IT basics, economics/intro business, clinical reasoning (text scenarios), electrical/automotive troubleshooting (text), history source outlines, vocab/languages (flashcards/quiz), writing/explanations.

### Explicitly **not yet introduced** as product experiences

Educational stock/trading simulator UI, live market data, NCLEX product pack, full anatomy 3D, chemistry virtual lab runtime, language speaking rooms, music tuner/practice, CAD, cybersecurity interactive sandbox, map GIS, spreadsheet modeler, debate room with audio.

---

## 5. Domain × activity capability matrix (conceptual)

| Domain family | Primary engines | Secondary | Specialized later |
|---------------|-----------------|-----------|-------------------|
| **Java / Programming** | Coding, Quiz, SIX, Flashcards, Project, Tutor | Simulation (rare) | Interview timer UX |
| **SQL / Data** | SQL, Quiz, Project, Tutor, SIX | Coding | Spreadsheet/BI workspace |
| **Nursing / Clinical** | Simulation, Lab, Quiz, SIX, Tutor, Flashcards | Writing, Case study content | Skills checklist media, dosage engine |
| **Finance / Trading (edu)** | Simulation, Quiz, Project, Tutor, SIX, Game | Flashcards, Writing | Chart analysis workspace; **never brokerage** |
| **Electrical / Trades** | Lab, Simulation, Quiz, Tutor, SIX | Project | Virtual multimeter/equipment |
| **History / Humanities** | Writing, Presentation, Quiz, SIX, Tutor | Simulation, Flashcards | Timeline/map viewers |
| **Language learning** | Flashcards, Quiz, Writing, Tutor, SIX | Game | Conversation/speaking engine |
| **Math** | Quiz, Tutor, SIX, Flashcards | Writing (proofs) | Math workspace |
| **Music / Art** | Quiz, Project, Presentation, CORE ink | — | Practice engines |

Reusable capabilities: Quiz, Flashcard, SIX, Tutor, Writing, Project, Lab (rubric), Simulation (scenario), Coding, SQL, Experience/Scaffolding chrome, Adaptive bind, Lucky retention.

---

## 6. Content type inventory

| Content type | Status | Notes |
|--------------|--------|-------|
| Explanation / objective / task | **Existing** | Experience projection |
| Worked example / hint / step / checklist | **Partial** | Scaffolding 2P-12; sparse authored |
| Rubric / criteria | **Existing** | Structured activities |
| Coding challenge / starter | **Existing** | Small catalog |
| SQL dataset / expected rows | **Existing** | Educational sandbox |
| Lab / procedure text | **Partial** | Rubric labs |
| Simulation scenario | **Partial** | Text decision scenarios |
| Quiz question / flashcard | **Existing** | Deep product |
| Writing / project / presentation prompt | **Partial** | Few fixtures |
| Misconception example | **Partial** | Orchestrator/evidence hints |
| Diagram / image / video reference | **Partial** | CORE/media; not activity-first |
| Reading / source document | **Partial** | CORE notes, materials |
| Case / clinical / business scenario | **Partial** | Sim fixtures |
| Chart / graph / equation | **Missing** as first-class activity content | Future combo/specialized |
| Map / timeline / 3D / interactive model | **Missing** | Specialized or future content |
| Conversation / pronunciation / listening | **Missing** | Language engine |
| Dataset (analytics) | **Partial** via SQL | Broader packs later |

Preserve pipeline:

```
source → Concept → content → progression → coverage → experience → scaffolding
 → learner interaction → evaluation → evidence → ConceptMastery → Orchestrator
```

---

## 7. Learner experience gaps

| Surface | State | Gap |
|---------|-------|-----|
| Study Hub | Working | Orchestrator presentation; not a second selector |
| CORE | Working | Authoring depth continuous; learning via Adaptive CTA |
| Study Now | Working | Time-blocked SIX/Lucky/planner |
| Adaptive | Working engine | Content breadth; Writing/Game/Project excluded |
| Learner Model | Working | Presentation polish; PERFORM_GAP not diagnosed |
| Assignments | Partial | Practice deep-links; not full Adaptive |
| Planner / Calendar | Working product | Not evidence producers |
| LMS | Partial | Connect/diagnose; not ULE content CMS |
| Tutor | Working | Authorized evidence only |
| SIX / LUCKY | Working | Preserve |
| Activities UX | Working + experience/scaffolds | Catalog depth; richer sim/lab UI later |
| Assessments | Working | Grow item banks |
| Content discovery | Partial | Resources/discover; not full library |
| Browser E2E | **Missing harness** | Documented limitation |

---

## 8. AI / personalization gaps

| Area | Exists | Safe next | Future |
|------|--------|-----------|--------|
| Learner Model facets | Yes | Richer presentation | Confidence/calibration signals |
| Orchestrator diagnosis | Yes | — | Do not replace |
| Misconceptions | Partial | Enrich evidence hints | Dedicated misconception content |
| Difficulty / progression | Soft stages | Content packs | True adaptive difficulty without second engine |
| Content variation | 2P-9 exclude keys | More variants | AI-assisted pack authoring (offline/reviewed) |
| AI tutoring | Tutor service | Keep authorized evidence | Multimodal tutor |
| AI-generated activities | Not required path | Human-reviewed generation into catalogs | Never LLM-as-mastery |
| Voice / multimodal | Thin | — | Language/music engines |
| Document/image understanding | CORE/OCR partial | Bridge to Concepts | Diagram Q&A |

**Rule:** AI assists learning; **evidence/mastery stay server-authoritative.**

---

## 9. Universal vs specialized decisions

**Universality test:** *Can this extend existing contracts (activity kind, content descriptor, progression, experience, scaffolding, evaluate → evidence → mastery → Orchestrator / Adaptive), or does the learner interaction require a new runtime?*

| Specialize when… | Stay universal when… |
|-------------------|----------------------|
| Native media capture (audio/3D/CAD) | Text scenario + rubric suffices |
| Domain physics simulation runtime | Decision narrative fits Simulation |
| Symbolic math step engine | Quiz/Tutor covers assessment |
| Real device/protocol sandbox | Troubleshooting write-up fits Lab/Sim |

**Justified specialization examples:** Math workspace; language speaking; 3D anatomy; CAD; music practice; virtual equipment.

**Not justified as engines:** “Nursing engine,” “Finance engine,” “History engine” — those are **content domains**.

---

## 10. Priorities (P0–P3)

### P0 — Integrity / architectural blockers
- Preserve completion ≠ success ≠ mastery (2P-13)
- No second Orchestrator / mastery / evidence / learner model
- No real-money trading / brokerage
- No giant subject enum
- Keep CLIENT work-only submissions

### P1 — Highest-value product gaps
1. **Content packs** for Adaptive-ready engines (Coding, SQL, Lab, Simulation, Presentation) across CS, networking, health scenarios, trades troubleshooting, economics/market education
2. **Experience/scaffold authored depth** on top challenges (not more engines)
3. **Educational market/trading scenarios** as Simulation (+ Quiz/Project) content — fake portfolios/scenarios
4. Learner-facing clarity already partly done (2P-11/12); keep polishing outcomes honesty

### P2 — Major expansion
- Make **Writing** (and later **Project**) Adaptive-ready if Orchestrator CREATE/PRACTICE needs them
- Domain packs: Nursing/NCLEX-style banks, language flashcards, history sources
- Chart/data analysis as combo (SQL + Simulation content) before specialized BI
- Optional richer Simulation interaction (state machine UI) without new mastery path

### P3 — Future / advanced experiences
- Math workspace engine
- Language conversation/speaking
- 3D anatomy / CAD / music / art practice
- Cybersecurity interactive sandbox / network topology visualizer
- Virtual equipment trainers
- Voice multimodal tutor

---

## 11. Recommended next phases (build sequence)

Suggested phase IDs (implementation later — **not started in 2P-14**):

| Phase | Focus | Why first |
|-------|-------|-----------|
| **2P-15** | Adaptive-ready **content density** (CS + networking + clinical + market edu + trades) | Highest leverage; spine already closed |
| **2P-16** | Authored scaffolding + success criteria coverage across catalog | Interaction quality without new engines |
| **2P-17** | Educational **market/trading simulation pack** (fake money) on Simulation | Explicit new domain experience users asked for |
| **2P-18** | Writing Adaptive-ready (if product needs CREATE in Adaptive) | Closes known PRODUCT≠ADAPTIVE gap |
| **2P-19** | Nursing / health content pack (Quiz + Sim + Lab + Flashcards) | Broad domain without specialization |
| **2P-20+** | First specialized engine only after failure of universality test (likely Math or Language speaking) | Avoid premature engines |

---

## 12. Architecture safety rules

This expansion plan **must not** require:

- Second Orchestrator, Learner Model, Knowledge Model, Mastery, or Evidence system
- Separate learning loop per subject
- Giant subject enum / taxonomy microservice
- Microservices rewrite or native iOS rewrite
- Mandatory vendor lock-in
- **Real-money trading / brokerage infrastructure**

**Stock/market learning (explicit):** educational market simulation using **fake money** and data-driven scenarios — not a brokerage, not live order routing, not custody of funds.

**Compatibility:** keep free-form `subjectDomain` / concept titles; engines remain mechanisms.

---

## 13. Future domains / experiences not yet introduced

Explicit backlog (design-only):

1. Educational stock/trading simulator (fake portfolio, scenario markets)
2. Live/delayed market data classroom feeds (optional later; still not brokerage)
3. NCLEX / nursing item banks as product packs
4. Anatomy 3D explorer
5. Chemistry/physics interactive labs
6. Language speaking/listening rooms
7. Music practice room
8. Art critique / drawing studio beyond CORE
9. CAD / engineering design studio
10. Cybersecurity interactive range
11. Network topology builder
12. Map/GIS geography lab
13. Spreadsheet / financial modeling workspace
14. Debate/oral argument with recording
15. Virtual equipment trainers (multimeter, HVAC controls, etc.)
16. Math symbolic workspace
17. Medical dosage calculator practice environment

---

## Deterministic inventory helper

Code mirror of Adaptive-ready vs product-ready keys (no engines):

`src/lib/learning/product-expansion/inventory.ts`

Use for regression: Adaptive-ready set remains `coding|sql|lab|simulation|presentation`; Writing/Game/Project stay non-Adaptive until an explicit later phase.

---

## What 2P-14 intentionally did **not** do

- No new activity engines or routes
- No new DB tables / CMS
- No domain enum
- No Orchestrator/mastery/evidence changes beyond inventory documentation
- No removal of existing buttons, workflows, or direct activity access
