# Universal Content Progression & Variation (2P-9)

> **Content progression describes available learning experiences; it does not decide what the learner needs.**

> **The Orchestrator decides the intervention. The content layer finds a valid experience that can implement it.**

> **Content variation changes the experience, not the learner's canonical knowledge identity.**

## 1. Content stage

```ts
type LearningContentStage =
  | "INTRODUCE" | "UNDERSTAND" | "PRACTICE"
  | "APPLY" | "CHALLENGE" | "RETAIN";
```

Stages describe **content intent**. They are **not** Orchestrator diagnoses (`UNDERSTANDING_GAP`) and **not** mastery facets (`EXPLAIN` / `APPLY`).

No mandatory ladder: learners are never forced INTRODUCE→…→RETAIN.

## 2. Difficulty

Ordinal `1 | 2 | 3 | 4 | 5` (introductory → challenge). Content metadata for ranking/filtering only. Does not override ConceptMastery or diagnosis.

## 3. Variant identity

Stable `contentKey` per progression entry. Points at 2P-7 `contentId` when a Universal Activity is used. Not title/index/random runtime ids.

## 4. Content relationships

Entries share a `conceptKey` (normalized concept title grouping). Sibling variants — **not** a forced A→B→C chain / curriculum engine.

## 5. Context variation

`contextVariant` (e.g. coffee / housing / gasoline markets) supports transfer without new mastery facets.

## 6. Deterministic selection

`selectProgressionContent`:

1. Filter by conceptKey + ownership  
2. Optional eligible activity kinds  
3. Exclude failed keys **only if alternatives remain**  
4. Prefer different context when `avoidContextVariant` set and alternatives exist  
5. Rank by preferred stages → difficulty proximity → difficulty → contentKey  

No LLM, no uncontrolled randomness, no fabricated entries.

## 7. Failure variation

After FAIL, pass `excludeContentKeys: [failedKey]`. Selector picks another valid entry when available; otherwise may reuse the only candidate.

## 8. Success variation

Use `avoidContextVariant` / different preferred stage so success does not force identical repetition when alternatives exist.

## 9. Transfer

Same Concept + different `contextVariant` = transfer practice. Evidence still decides mastery.

## 10. Orchestrator boundary

```
Orchestrator → intervention
  → content progression selection
  → activity / SIX experience
  → evaluation → evidence → ConceptMastery → Orchestrator
```

Selector never diagnoses, never writes evidence/mastery, never replaces Adaptive completion or Assessment.

## 11. SIX fallback

Entries may use `activityKind: "six"` with `contentId: null`. If no compatible UA content: return unavailable — never invent an activity.

## 12. Adaptive integration

After Adaptive-ready intervention (Coding/SQL/Lab/Simulation/Presentation), selector supplies an appropriate `contentId` / stage. Lifecycle unchanged: launch → interact → evidence → bind → re-orchestrate.

## 13. Assessment separation

Progression does not create ASSESS intent. Assessment workflow remains separate.

## 14. LUCKY relationship

`RETAIN` stage is metadata only. Does not auto-create Lucky items. Terminal Adaptive→Lucky handoff unchanged.

## 15. Source provenance

2P-8 pipeline remains the source→concept→objective→prepare path. Progression entries may be system-authored without a learner source.

## 16. System-authored content

`authorship: "system"` shared catalog entries are valid (e.g. DHCP simulation). CORE is one source path, not the only path.

## 17. Ownership

Learner-authored entries require matching `ownerLearnerId`. System-authored included by default. Foreign Concept ownership still enforced at evidence time (`assertOwnedConcept`).

## 18. Version identity

`contentVersion` (`v1:{contentKey}`) — lightweight, not Git. Attempts can cite contentKey/version later.

## 19. Deferred

- Persistent progression CMS / Prisma tables  
- Autonomous mastery-based difficulty engines  
- LLM variant generation  
- Mandatory curriculum paths / prerequisite engines  
- Massive content libraries  

---

Module: `src/lib/learning/content-progression/`
