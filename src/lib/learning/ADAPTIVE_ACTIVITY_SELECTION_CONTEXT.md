# 2G-74 — Adaptive Activity Selection & Context Quality

## Layers (never collapsed)

| Layer | Question | Owner |
|-------|----------|--------|
| **Diagnosis** | What learning problem exists? | `diagnose.ts` |
| **Capability** | Can this activity legally serve that diagnosis? | `activity-intervention-capability.ts` |
| **Compatibility** | Does it fit this concept/context? | `activity-intervention-compatibility.ts` |
| **Availability** | Can this learner launch it now? | `activity-intervention-policy.ts` |
| **Ranking** | Which MATCH+available wins? | `activity-intervention-ranking.ts` |

Flow:

```
Diagnosis → Capability → Compatibility → Availability → Ranking
→ optional activityIntervention → Adaptive Activity Step → …
```

Activity selection never feeds diagnosis. Available activities do not create gaps.

## Concept-first rule

Concept is the primary ULE knowledge atom.

Authoritative signals (preferred):

1. `Concept.subjectDomain`
2. `LearningSpace.subjectDomain` (Course projection)

Contextual cues (secondary):

- Concept title
- Topic name (legacy)

TopicMastery is never used for activity fitness.

## Compatibility states

| Status | Meaning | Auto-select? |
|--------|---------|--------------|
| `MATCH` | Enough context supports the activity | Eligible |
| `NO_MATCH` | Authoritative domain belongs to another family | No |
| `INSUFFICIENT_CONTEXT` | Cannot safely decide | No → SIX |

No guessing. Unrecognized `subjectDomain` is insufficient even if the title looks related.

## Compatibility matching (2G-77)

Substring containment is **unsafe** (`"computer science".includes("science")`
falsely matched Lab). Matching is now:

1. Normalize case / whitespace / separators (`/`, `_`, `-`, punctuation)
2. Tokenize into whole tokens
3. Match capability `contextHints` as **contiguous token phrases**
4. Prefer **longer phrase matches** over shorter ones when competing Adaptive-ready
   families also match the same haystack

Examples:

| Domain | Result |
|--------|--------|
| `computer science` | Coding MATCH (`computer science` phrase); Lab **NO_MATCH** (shorter `science` outranked) |
| `science` | Lab MATCH |
| `javascript` | Coding MATCH via token `javascript`, not bare `java` inside the word |
| `laboratory methods` | Lab insufficient (hint is `lab`, not a substring of `laboratory`) |

Explicit multi-word hints in the capability registry (e.g. `computer science`)
are treated as phrase aliases. No fuzzy/LLM/embedding matching.

`MATCH` / `NO_MATCH` / `INSUFFICIENT_CONTEXT` remain distinct; uncertainty never
becomes MATCH.

## Adaptive-ready mappings (APPLICATION_GAP lane)

| Activity | Typical match cues (capability `contextHints`) |
|----------|--------------------------------------------------|
| Coding | code, programming, javascript, python, software, … |
| SQL | sql, query, database, relational, … |
| Lab | lab, experiment, science, biology, chemistry, … |
| Simulation | simulation, market, economics, supply/demand, … |
| Presentation | presentation, speech, audience, outline, … |

Primary diagnosis for auto-select: **APPLICATION_GAP** (+ PRACTICE when required).

## SIX fallback

No MATCH, unavailable, not Adaptive-ready, not intervention-eligible, UNDERSTANDING/RECALL/RETENTION/INSUFFICIENT/NO_INTERVENTION → existing SIX intervention only.

## Intent (soft)

- PRACTICE may unlock compatible Adaptive-ready activities
- UNDERSTAND does not force activities
- ASSESS → Assessment workflow
- CREATE → specialized creation
- Intent cannot override diagnosis, capability, compatibility, availability, or ownership

## Deterministic ranking

1. Compatibility strength (`subjectDomain` = 2 > title/topic = 1)
2. Matched token count (more specific wins)
3. Registry declaration order (stable tie-break)

Same inputs ⇒ same winner. No random / LLM / embeddings.

## Ownership / availability

Availability = owned `conceptId` + launch + evidence + `adaptiveBindIntegrated`.

Compatibility MATCH does not imply available. Unavailable candidates do not contaminate diagnosis or steal another activity’s slot.

## Why LLM / embeddings / fuzzy matching are deferred

Deterministic, inspectable, and diagnosis-safe. Semantic inference can invent
domain fit without authoritative metadata. Fuzzy distance would reintroduce
accidental near-matches.

## Game / Writing / Project

Remain **PRODUCT-READY but NOT ADAPTIVE-READY** (`adaptiveBindIntegrated: false`). Not selected here.

Quiz / Flashcard remain assessment/retention adapters — not Universal Activity selector targets.

## Files

- `activity-intervention-compatibility.ts` — compatibility + 2G-77 token/phrase matching
- `activity-intervention-ranking.ts`
- `activity-intervention-policy.ts` — layered selection
- `diagnose.ts` / `orchestrator/index.ts` — pass `subjectDomain`
- `activity-selection-context.test.ts`
- `activity-compatibility-matching.test.ts` (2G-77)
- `sequence/adaptive-activity-lifecycle.integration.test.ts` (2G-76/77)
- this doc
