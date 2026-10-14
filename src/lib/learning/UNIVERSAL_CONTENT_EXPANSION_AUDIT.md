# Universal Content Expansion Audit (2P-26)

Audit completed before content authoring. Architecture is closed; gaps are **catalog depth**, not missing engines.

## Existing spine (reuse only)

| Layer | Path | Role |
| --- | --- | --- |
| Pipeline | `content-pipeline/` | prepare → validate |
| Production | `content-production/` | lifecycle, integrity, seeds, enrichment |
| Progression | `content-progression/catalog.ts` | stages / difficulty / variants |
| Coverage | `content-coverage/` | AVAILABLE / MISSING / INCOMPATIBLE |
| Scaffolding | challenge `scaffolds` + `scaffolding/` | learner support |
| Activities | coding / SQL / structured (+ edu-market, writing packs) | UA catalog |
| Contracts | `content-contract.ts`, Adaptive completion contracts | Adaptive-ready gates |

**No subject engines. No second content CMS. No Prisma content tables.**

## Live inventory (pre-expansion)

| Catalog | Count |
| --- | ---: |
| Coding | 7 |
| SQL | 3 |
| Structured (base + market + writing) | ~41 |
| **UA total** | **~51** |
| Progression entries | ~60 |
| Adaptive seed registry | 27 (cap &lt; 40) |

### Structured by kind (approx.)

writing 12 · simulation 17 · lab 4 · presentation 3 · project 3 · game 2

## Domains — depth assessment

| Domain | Depth | Notes |
| --- | --- | --- |
| Finance (edu market) | DEEP | 12 sims — strongest pack |
| Computer science | DEEP–MODERATE | coding + SQL + OOP seeds |
| SQL | MODERATE | 3 challenges — needs HAVING/NULL/LEFT JOIN depth |
| Networking | MODERATE | DHCP/DNS + connectivity lab |
| Writing | MODERATE | adaptive writing seeds exist |
| Math / science | MODERATE–THIN | density, force, proportion |
| Nursing | THIN | 2 sims |
| History | THIN | presentation + writing |
| Electrical / automotive | FIXTURE | 1 each |
| Cybersecurity | **NONE** | gap |
| Language speaking | THIN (UA) | quiz/flashcard product-deep |

## Adaptive-ready vs product-ready

**Adaptive-ready UA:** coding, sql, lab, simulation, presentation, writing  
**Product-ready only:** game, project  
**Separate deep products:** quiz, flashcard, SIX, Tutor, LUCKY, CORE

## Placeholders / weak spots

- Single-fixture trades labs
- Keyword rubrics (acceptable within existing structured evaluation — not a new engine)
- Seed registry must stay under 40 — expansion goes in catalogs + progression, not mass seed dump
- Design-time packs (`pack-model.ts`) are planning labels without authored bodies

## Best extension point

1. New pack module merged into `STRUCTURED_CHALLENGES` (same pattern as educational-market / writing)
2. Grow `CODING_CHALLENGES` / `SQL_CHALLENGES` arrays
3. Matching `ContentProgressionEntry` groups in progression catalog
4. Enrichment: scaffolds, misconceptionTargets, accessibility
5. Run `auditCatalogIntegrity()` — must remain empty

## Expansion priorities (this phase)

**P1 depth:** CS/SQL, networking, nursing, electrical/trades, history, writing, math/science, cybersecurity intro  
**Avoid:** hundreds of shallow “What is X?” rows; subject-specific engines

## Integrity validators that must pass

- `auditCatalogIntegrity()` / `catalogIntegrityOk()`
- Seed size constraints if seeds touched (`15 ≤ n < 40`)
- Existing content-production + universal-content-contract + progression tests
