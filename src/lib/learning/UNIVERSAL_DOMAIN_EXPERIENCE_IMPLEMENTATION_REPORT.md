# UNIVERSAL_DOMAIN_EXPERIENCE_IMPLEMENTATION_REPORT — 2P-36

## Completed

Added `domain-experience` pack (**17** structured challenges + **17** progression entries) across:

| Family | Concepts deepened |
|--------|-------------------|
| Mathematics | linear solve, error diagnosis, probability, Pythagoras, word modeling (**no CAS**) |
| Physics | mechanical energy transfer |
| Chemistry | periodic trends (Na vs Cl) |
| Biology | genotype/phenotype, homeostasis feedback |
| Cybersecurity | authentication vs authorization |
| Networking | DNS vs DHCP diagnosis |
| Nursing | vital-signs interpretation (educational disclaimer in prompt) |
| Business | inventory reorder reasoning |
| Electrical | GFCI safety sequence |
| Automotive | no-start diagnostic INTRODUCE |
| Languages | Spanish cognates game + English SVA writing (**no speaking**) |

## Existing reused

- `STRUCTURED_CHALLENGES` merge + rubric evaluation
- `CONTENT_PROGRESSION_CATALOG`
- Lab / Simulation / Writing / Game kinds
- `recordAuthoritativeActivityEvidence` → ConceptMastery pipeline
- Adaptive-ready UA adapters (lab/simulation/writing/game)
- Educational market (prior) untouched; paper-only preserved

## Adaptive-ready

All 17 use Adaptive-ready mechanisms (`lab` | `simulation` | `writing` | `game`).  
Contract assessment smoke: `lab-math-solve-linear` mechanismAdaptiveReady = true.  
Full Orchestrator→bind browser loop for every new item: **not** individually re-proven (reuse prior Adaptive E2E + unit evaluate path).

## Evidence facets produced (by design)

SOLVE, EXPLAIN, APPLY, PERFORM, RECOGNIZE — existing MasteryFacet only.

## Content

17 contentKeys (see `UNIVERSAL_DOMAIN_EXPERIENCE_MATRIX.md`). Stages span INTRODUCE→APPLY (selected); not every concept has full INTRODUCE→RETAIN ladder yet.

## Tests

| Gate | Result |
|------|--------|
| `domain-experience.test.ts` | **8 PASS** |
| `universal-activity-depth.test.ts` | **27 PASS** (after ≥3 criteria on new labs) |
| `npx vitest run src/lib/learning` | recorded in final status |
| Full `npm test` | PASS WITH NOTES — 6 pre-existing non-ULE fails (schedule/highlights) |
| `e2e/domain-content-smoke` desktop | **4 PASS** (incl. math lab open≠evidence) |
| Full `npm run test:e2e` | **NOT RUN** this phase (prior 2P-35 baseline; targeted smoke run) |
| `npm run build` | **PASS** |
| ESLint (pack TS) | **PASS** |
| Full-repo lint | PRE-EXISTING debt (2P-35) |
| `npx prisma validate` | **PASS** — **No migration required** |

## Deferred

- HVAC / construction / manufacturing / philosophy / psychology / art / music full packs
- Math CAS / symbolic workspace
- Speaking language runtime
- Full INTRODUCE→RETAIN ladders for every new concept
- Full Playwright suite re-run (time; smoke covered)

## Specialized runtime candidates

1. Symbolic CAS / algebra AST workspace  
2. Interactive network topology / packet sandbox  
3. Speaking/conversation ASR-TTS  
4. Virtual multimeter / ECU hardware UI  
5. Live clinical decision support (must remain educational text)  
6. Real brokerage (forbidden — edu market exists)

## Regressions

- Transient: labs with &lt;3 criteria broke `universal-activity-depth` — **fixed** by adding third criterion.  
- Corrupted `.next/dev/types` — cleaned and rebuild **PASS**.

## Remaining gaps

Math/science/trades/languages still thinner than CS/SQL. Humanities beyond history largely missing. No subject engines introduced.

## Architecture integrity

**One ULE · One Learner Model · One Knowledge Model · One Evidence spine · One Mastery contract · One Orchestrator · One Tutor · One Adaptive engine · One Retention engine · CORE → SIX → LUCKY preserved**
