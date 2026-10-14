# Universal Content Coverage & Gap Handling (2P-10)

> **Content coverage tells the system what learning experiences are actually available. It does not tell the system what the learner needs.**

> **Missing content is not missing mastery.**

> **Unavailable content must produce a truthful unavailable state, not fabricated content.**

## 1. Coverage definition

Whether Study Haul has at least one **valid, usable** learning experience for:

```
Concept + intervention preference + activity capability + context + progression preference
```

Not: item counts, mastery %, concept DB size.

## 2. Coverage statuses

| Status | Meaning |
|--------|---------|
| `AVAILABLE` | ≥1 usable candidate |
| `INCOMPATIBLE` | Concept has content, but not for the requested mechanism |
| `UNAVAILABLE` | Compatible content exists but cannot launch now |
| `MISSING` | No appropriate content for the Concept |

## 3. Coverage vs mastery

Coverage = content state. ConceptMastery = learner state. Independent.

## 4. Coverage vs diagnosis

Coverage never writes or changes Orchestrator diagnosis / facets / evidence.

```
Orchestrator (need) → Coverage (availability) → Progression selection → Activity → Evidence → ConceptMastery
```

## 5. Coverage vs progression

Coverage: *is there usable content?*  
Progression selection: *which usable content?*  
`evaluateContentCoverage` may call `selectProgressionContent` after availability filtering.

## 6. Ownership

System-authored shared; learner-authored only when `ownerLearnerId` matches. Foreign content never candidates.

## 7. Readiness

`readiness: DRAFT | ARCHIVED` excluded. Catalog defaults `READY`. Reuses 2P-8 readiness spirit (no second CMS).

## 8. Activity availability

`evaluateContentAvailability`: catalog `contentId` must resolve; optional `unavailableActivityKinds` / `unavailableContentKeys` for runtime gaps. SIX always launchable when present.

## 9. Capability compatibility

Requested `activityKind` / `eligibleActivityKinds` filter. Wrong mechanism → `INCOMPATIBLE` (not `MISSING`).

## 10. Stage

Soft preference by default. `requireExactStage: true` can yield `INCOMPATIBLE`. Alternate stage ≠ automatic `MISSING`.

## 11. Difficulty

Soft preference by default. `requireExactDifficulty: true` for strict match.

## 12. Context variation

`contextVariant` treated as *just-used / avoid* when alternatives exist; never report `MISSING` solely for preferred-context miss.

## 13. Exhaustion

Pass recently used/failed keys via `excludeContentKeys` / `unavailableContentKeys`. No new attempt-history DB.

## 14. Failure variation

Exclude failed keys when alternatives remain; else truthful `UNAVAILABLE` / sole fallback via progression rules.

## 15. SIX fallback

`fallbackEligible` when SIX entries exist for the Concept. Coverage does not invent interventions — reports capability only.

## 16. Adaptive

Coverage may block unusable steps; does not mutate Adaptive runs, completion, or Lucky handoff.

## 17. Assessment

Does not convert ASSESS → SIX. Assessment workflow remains authoritative.

## 18. LUCKY

Coverage never creates Lucky items. `RETAIN` remains metadata.

## 19. CORE

Confirmed Concept without activity content → truthful `MISSING`/`INCOMPATIBLE`; no fabricated Continue-Learning activity.

## 20. Domain generalization

No subject enums / domain switches. Fixtures prove CS, networking, nursing, electrical, business, unknown.

## 21. Determinism

Identical requests → identical results. No LLM / random.

## 22. No-fabrication rule

Never invent activities. Selected UA `contentId` must resolve in 2P-7 catalog.

## 23. Deferred

Content CMS, marketplace, LLM generation, analytics DB, mastery-driven difficulty, curriculum engines.

---

Module: `src/lib/learning/content-coverage/`  
Helper: `evaluateContentCoverage(request) → ContentCoverageResult`
