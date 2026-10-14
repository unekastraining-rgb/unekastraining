# 2G-64 — Orchestrator Candidate Truth Audit

**Status:** INSPECTION / DESIGN ONLY — no production behavior changes  
**Date:** 2026-03-22  
**Depends on:** 2G-61 (reconciliation), 2G-62 (truth boundary), 2G-63 (Hub ConceptMastery visibility)

---

## 1. Executive summary

Study Hub’s primary ULE recommendation (`GET /api/study/orchestrator-suggestion` → `getTopOrchestratorSuggestion`) discovers candidates as **Topics** owned by the learner’s Courses (optional `courseId` filter; up to 40 by `sortOrder`), **ranks them with TopicMastery** (`reviewCount === 0` first, then lowest `proficiency`), maps each Topic to a Concept via `Topic.conceptId` / `ensureConceptForTopic`, then runs **ConceptMastery-based** Orchestrator diagnosis.

**Verdict:** Candidate identity is **Topic-first with Concept mapping (B)**. Architecture is effectively:

```text
TopicMastery ranking  →  ConceptMastery diagnosis
```

That is a **real ULE priority leak at the selection layer** (not a mastery-claim leak): TopicMastery can decide *which* concept is tried first and therefore which recommendation the learner sees, even though diagnosis/presentation after selection correctly use ConceptMastery (2G-62/2G-63).

**Recommended future strategy: Option B — Topic discovery, Concept ordering.**

Keep Course/Topic/LearningSpace as discovery surfaces; stop using TopicMastery proficiency/reviewCount as the ULE priority ranker. Order (or re-rank) candidates with ConceptMastery / Evidence before diagnosis wins.

---

## 2. Complete candidate pipeline

```text
Study Hub (OrchestratorSuggestionCard)
  ↓ fetch GET /api/study/orchestrator-suggestion?courseId=…
  ↓ app/api/study/orchestrator-suggestion/route.ts
  ↓ getTopOrchestratorSuggestion(userId, courseId?)
  ↓
candidate discovery
  • Topic.findMany where course.userId = learner
  • optional courseId filter; orderBy sortOrder; take 40
  • include TopicMastery (masteries where userId, take 1)
  ↓
candidate ordering / ranking  ← TopicMastery here
  • proficiency = mastery?.proficiency ?? 0
  • reviewCount = mastery?.reviewCount ?? 0
  • sort: reviewCount===0 first, then lowest proficiency
  • prefer topics with conceptId (slice 8); else top 3 without
  ↓
candidate selection (sequential try)
  • for each Topic in rank order:
      conceptId = topic.conceptId ?? ensureConceptForTopic(userId, topicId).id
      orchestrateForConcept(userId, conceptId, { courseId, topicId, topicName })
  ↓
ConceptMastery / evidence lookup (per candidate)
  • getLearnerConceptMastery → ConceptMastery facets (or empty) + linked TopicMastery
  • diagnose may use TopicMastery fallback when ULE facets insufficient
  • optional prerequisite enrichment (ConceptMastery of prereqs)
  • optional Evidence Intelligence enrichment (flag-gated; post-diagnose)
  ↓
diagnosis (orchestrateFromLearnerState)
  • facet scores vs WEAK/STRONG thresholds → APPLICATION / REVIEW / …
  ↓
intervention (SIX policy from diagnosis)
  ↓
first non-NO_INTERVENTION, non-insufficient wins
  • insufficient kept as last-resort fallback
  ↓
presentOrchestratorSuggestion → Hub card (+ Adaptive CTA via hub-adaptive-bridge)
```

### Relevant files / functions

| Stage | File | Function / symbol |
| --- | --- | --- |
| Hub entry | `src/components/study/OrchestratorSuggestionCard.tsx` | `load` → fetch |
| API | `app/api/study/orchestrator-suggestion/route.ts` | `GET` → `getTopOrchestratorSuggestion` |
| Discovery + order + select | `src/lib/learning/orchestrator/suggest.ts` | `getTopOrchestratorSuggestion` |
| Concept map | `src/lib/learning/knowledge/concept.ts` | `ensureConceptForTopic` |
| Orchestrate | `src/lib/learning/orchestrator/index.ts` | `orchestrateForConcept` |
| Learner state | `src/lib/learning/learner-model/read.ts` | `getLearnerConceptMastery` |
| Diagnose | `src/lib/learning/orchestrator/diagnose.ts` | `orchestrateFromLearnerState` / `effectiveFacetsForOrchestration` |
| Evidence enrich | `src/lib/learning/orchestrator/evidence-enrichment.ts` | `enrichOrchestratorWithEvidenceSignals` |
| Prereq enrich | `src/lib/learning/orchestrator/prerequisites.ts` | `enrichOrchestratorWithPrerequisites` |
| Present | `src/lib/learning/orchestrator/present.ts` | `presentOrchestratorSuggestion` |
| Adaptive consume | `src/lib/learning/orchestrator/hub-adaptive-bridge.ts` + `sequence/coordinator.ts` | uses selected `conceptId` |

Secondary / out-of-band paths (not Hub top-suggestion ranking):

- Adaptive `startAdaptiveSequenceRun` / resume: takes an already-chosen `conceptId`, then `orchestrateForConcept` — no TopicMastery candidate ranking.
- Tutor / Quiz / Flashcards entry: typically pass concept or topic already chosen by the user or by Hub.
- Legacy focus-topic helpers (`resolve-loop-focus-topic`, etc.): separate from `getTopOrchestratorSuggestion`.

---

## 3. Candidate identity model

**Classification: B — Topic-first with Concept mapping**

| Question | Answer |
| --- | --- |
| Raw candidate entity | `Topic` (scoped by learner’s Courses via `course.userId`) |
| Canonical ULE id after map | `conceptId` |
| How `conceptId` is obtained | Prefer `Topic.conceptId`; else `ensureConceptForTopic(userId, topic.id)` (creates/links Concept + LearningSpace; does not create ConceptMastery) |
| LearningSpace | Not queried in `getTopOrchestratorSuggestion` |
| Assignment | Not a candidate source here |
| Legacy focus topic | Not used in this Hub suggestion path |

So discovery is structural (Course → Topic), not Concept-first inventory and not ConceptMastery-first inventory.

---

## 4. Candidate discovery sources

1. **Topics** for the learner via `course.userId` (`db.topic.findMany`, optional `courseId`, `orderBy: sortOrder`, `take: 40`).
2. **TopicMastery** included per topic (`masteries` where `userId`) — used for ranking only; missing row ⇒ proficiency `0`, reviewCount `0`.
3. **Concept linkage** after ranking shortlist: existing `Topic.conceptId` or `ensureConceptForTopic` (creates Concept + LearningSpace link; does not by itself invent TopicMastery ranking).

No discovery from Concept table, ConceptMastery table, LearningAttempt, or Evidence aggregates in this path. Course status (e.g. ACTIVE) is **not** filtered in `suggest.ts`.

---

## 5. TopicMastery usages (candidate path)

| Location | Role | Class |
| --- | --- | --- |
| `suggest.ts` — `topic.masteries[0]` sort by `reviewCount` / `proficiency` | Decides try-order of Topics | **T3 — Ordering/ranking signal** |
| `suggest.ts` — missing mastery → proficiency `0`, reviewCount `0` | Unreviewed topics rise to front | **T3** (also soft discovery bias) |
| `learner-model/read.ts` — `getLearnerConceptMastery` TopicMastery fallback | Only when ConceptMastery row absent; LOW confidence | **T2 — Compatibility** (diagnosis input, not Hub ranker) |
| Hub Topic progress labels (2G-62) | Learner-facing Topic progress, not ULE claim | Outside candidate path |

**Not T1-only:** TopicMastery is not “existence only”; it **orders** candidates.

**T4 Hard filter:** No — TopicMastery does not remove Topics from the pool (only sorts).

**T5 ULE truth leak:** **Partial / yes at priority layer.** TopicMastery does not overwrite ConceptMastery numbers in diagnosis when ConceptMastery exists, but it **can determine which concept wins the Hub recommendation** before ConceptMastery is compared across candidates. That is an accidental priority leak relative to the post-2G-61 contract (“ConceptMastery = canonical ULE mastery”), not intentional ULE ranking.

---

## 6. ConceptMastery usages (candidate path)

| Location | Role | Class |
| --- | --- | --- |
| Not used in `getTopOrchestratorSuggestion` sort | — | **Not C1 / Not C2 for Hub ranking** |
| `getLearnerConceptMastery` inside `orchestrateForConcept` | Facet scores for diagnosis | **C3 — Diagnosis** |
| `orchestrateFromLearnerState` | Gap / intervention | **C3 + C4** |
| `prerequisites.ts` weak-prereq pick | After primary diagnosis; ConceptMastery scores | **C3** (hint only; does not re-pick Hub top Topic) |
| `presentOrchestratorSuggestion` / Hub `masterySummary` (2G-63) | Learner-facing ConceptMastery | **C5** |
| Adaptive run start | Diagnoses the already-selected concept | **C3 / C4** after selection |

**Current behavior:** ConceptMastery drives *whether* a tried candidate is actionable (gap vs NO_INTERVENTION / insufficient) and *what* intervention to show, but **not** which Topic is tried first.

---

## 7. Evidence Intelligence usages

| Signal | Used in Hub candidate ordering? | Used where? |
| --- | --- | --- |
| Recent attempts / success/fail / volume | No | Evidence enrichment after diagnose (flag-gated) |
| Misconception / facet weakness from evidence | No | Enrichment / presentation bias on already-chosen result |
| Recency | No | Initial fetch uses `sortOrder`; re-sort ignores recency |
| Insufficient evidence | Soft: diagnosis may mark insufficient; suggest keeps as fallback | Selection *after* Topic-ranked try, not rank input |

**Classification:** Evidence Intelligence is **diagnosis enrichment / presentation**, not a candidate-selection or candidate-ordering input for Hub top suggestion.

---

## 8. Candidate ordering / ranking logic

Exact sort in `getTopOrchestratorSuggestion` (`suggest.ts`):

1. Prefer `reviewCount === 0` (never reviewed on TopicMastery) over reviewed.
2. Else lower TopicMastery `proficiency` first.
3. (No further tie-break in the comparator; DB `sortOrder` only affects the initial fetch order before this re-sort.)

Then:

- Prefer up to 8 Topics that already have `conceptId`.
- Else take top 3 Topics without `conceptId` (will ensure Concept).

Then sequential scan: first Orchestrator result that is not `NO_INTERVENTION` and not insufficient wins. Insufficient saved if nothing better.

**No comparison of ConceptMastery overall/facet scores across candidates before that scan.**

---

## 9. Scenario A–E results

### Scenario A — TopicMastery strong, ConceptMastery weak

**Can strong TopicMastery deprioritize that concept?**  
**Yes.** High TopicMastery proficiency sorts the Topic later. Earlier Topics may win first. A weak-ConceptMastery concept can lose the Hub slot purely due to TopicMastery rank.

### Scenario B — TopicMastery weak, ConceptMastery strong

**Can weak TopicMastery cause recommendation despite strong ULE mastery?**  
**Partially mitigated, still biased.** Weak TopicMastery sorts early, so the concept is *tried* first. If ConceptMastery is truly strong → diagnosis → `NO_INTERVENTION` → skip. It will not usually be *shown* as a gap. But it burns the first slot and can block a later Topic whose ConceptMastery is actually weak if an earlier weak-Topic / mixed candidate returns a non-skip result first. Ordering bias remains TopicMastery-driven.

### Scenario C — TopicMastery missing, ConceptMastery exists

**Can the concept still become a candidate?**  
**Yes.** Missing TopicMastery ⇒ proficiency 0, reviewCount 0 ⇒ sorted to the front. Mapped via `conceptId` / ensure. Diagnosed with ConceptMastery.

### Scenario D — ConceptMastery missing, TopicMastery exists

**Can the topic still become a candidate?**  
**Yes.** Topic remains in discovery; `ensureConceptForTopic` creates/links a Concept (not a ConceptMastery row). `getLearnerConceptMastery` still returns a summary (empty ULE facets + linked TopicMastery). Diagnose may TopicMastery-fallback (LOW) or mark insufficient; suggest may keep insufficient as fallback. **Legitimate as legacy discovery**; **misleading** if a TopicMastery-fallback diagnosis were presented as full ULE truth (2G-62/63 reduce that risk for displayed mastery; Hub still may surface an insufficient / fallback orchestrator path).

### Scenario E — Two candidates, both with ConceptMastery; one weaker ULE

**Does ordering recognize ConceptMastery difference before diagnosis?**  
**No.** Order is TopicMastery-only. Diagnosis runs in Topic rank order; first actionable gap wins. Weaker ConceptMastery can lose to stronger TopicMastery priority.

---

## 10. Candidate discovery vs diagnosis boundary

**Actual architecture today:**

```text
TopicMastery ranking
      ↓
ConceptMastery diagnosis  (+ optional Evidence / prereq enrichment)
```

Not Concept-first discovery. Not Evidence-first discovery.

Topic-derived candidates are acceptable for *finding* work in a Course. The defect relative to the ULE contract is **TopicMastery as the reason one candidate wins over another**.

---

## 11. Whether a real ULE truth leak exists

| Layer | Leak? |
| --- | --- |
| Mastery *claim* on Hub card (numbers / labels) | No (bounded by 2G-62/63; ConceptMastery for ULE) |
| Diagnosis input when ConceptMastery exists | No (ConceptMastery) |
| **Which concept is recommended** | **Yes — TopicMastery ordering leak (T3 → effective T5 at selection)** |

Call it a **priority / selection truth leak**, not a mastery-math leak.

---

## 12. Compatibility risks

- Course/Topic curriculum remains the natural discovery surface for Study Haul.
- Many Topics still lack ConceptMastery until ensure/dual-write; Topic-only discovery must stay temporarily.
- Changing order without care could reshuffle Hub suggestions for learners mid-semester.
- TopicMastery fallback in `getLearnerConceptMastery` remains needed for sparse ConceptMastery rows (diagnosis only).
- Legacy focus-topic / Adaptive resume paths must keep working; they are not the same as Hub top-suggestion ranking.

---

## 13. ONE recommended future strategy

### **Option B — Topic discovery, Concept ordering**

Legacy Topic / Course / LearningSpace structures may **identify** candidates, but **ConceptMastery (and optionally Evidence)** should determine ULE try-order / priority before diagnosis wins.

---

## 14. Why that strategy is preferred

| Option | Why not / why |
| --- | --- |
| A Keep current | Leaves T3 selection leak; contradicts ConceptMastery-as-ULE-mastery for recommendations |
| **B Topic discovery, Concept ordering** | Preserves Course/Topic discovery; fixes the actual bug (who wins); smallest coherent change |
| C Concept-first discovery | Heavier; orphans curriculum Topics without Concepts; larger migration |
| D Evidence-first | Valuable later; Evidence is still flag-gated and sparse; don’t block B |
| E Larger redesign | Unnecessary; pipeline already maps Topic → Concept → diagnose |

Option B matches Preserve → Connect → Upgrade: keep Topic discovery, upgrade ranking to ConceptMastery.

---

## 15. What should NOT change (this audit + next phase constraints)

- Do **not** migrate or remove TopicMastery.
- Do **not** change mastery math / dual-write semantics.
- Do **not** change Orchestrator diagnosis thresholds or SIX intervention policy in the audit phase.
- Do **not** change Adaptive sequence engine, Tutor, Quiz, Flashcards product loops except as consumers of a better-ranked `conceptId`.
- Do **not** weaken 2G-62 truth boundary or 2G-63 ConceptMastery Hub line.
- Discovery may continue to start from learner Course Topics until a later Concept-first inventory exists.

---

## 16. Proposed next implementation phase (if any)

**2G-65 (suggested): Concept-ordered Hub candidates**

1. Keep Topic discovery from learner Course Topics (`course.userId` / optional `courseId`).
2. Resolve `conceptId` for each Topic (existing / ensure) **before** final priority sort (or sort a shortlist after resolve).
3. Rank by ConceptMastery weakness (e.g. lowest relevant facet / overall among UNDERSTANDING–TRANSFER), with explicit policy for missing ConceptMastery (e.g. treat as high priority or keep after ensure).
4. Optionally soft-bias with Evidence later (2G-66+); not required for B.
5. Leave `orchestrateForConcept` / diagnose / intervention / Adaptive unchanged.
6. Add regression tests: Scenario A/B/E ordering expectations under ConceptMastery rank.

Out of scope for 2G-65: TopicMastery deletion, LearningSpace rewrite, Evidence-first discovery.

---

## 17. Tests / inspection verification

### Design contract (this phase)

- `src/lib/learning/orchestrator-candidate-truth.design.test.ts`  
  Freezes documented invariants: Topic-first discovery, TopicMastery sort keys in `suggest.ts`, ConceptMastery not used in Hub rank sort, Evidence not used in Hub rank, recommended Option B string in this audit.

### Production behavior

- No production code changes in 2G-64.
- Existing Orchestrator / Hub / mastery tests remain the behavioral baseline.

### Manual inspection checklist

- [x] Trace Hub → `getTopOrchestratorSuggestion` → `orchestrateForConcept`
- [x] Confirm sort uses TopicMastery `reviewCount` / `proficiency`
- [x] Confirm ConceptMastery enters only inside per-candidate orchestrate
- [x] Confirm Evidence enrichment is post-diagnose
- [x] Scenario A–E answered from code
- [x] Single strategy: Option B

---

## Appendix — Architecture diagram (selection layer)

```text
┌─────────────────────────────┐
│ Course Topics (user-scoped) │  discovery (structural)
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ TopicMastery sort (T3)      │  ← ULE priority leak today
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ Topic → conceptId / ensure  │  identity map (B)
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ ConceptMastery diagnose     │  canonical ULE truth (C3)
│ + Evidence enrich (optional)│  not used for Hub rank
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│ First actionable suggestion │  Hub + Adaptive conceptId
└─────────────────────────────┘
```

**PASS criteria for 2G-64:** documentation complete; classifications assigned; Option B recommended; no production behavior change.
