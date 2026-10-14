# UNIVERSAL_CONTENT_DEPTH_ALL_AGES_AUDIT — 2P-48

**Mode:** Soft difficulty wiring + representative depth pack — no GradeSchoolEngine / AdultLearningEngine  
**Rule:** All-ages learning is a content/adaptation concern inside the universal learning system, not a separate learning engine.  
**Rule:** Learner age or grade does not replace evidence-based mastery.  
**Prior:** 2P-42…2P-47

---

## What already existed

| Capability | Status |
|------------|--------|
| `ContentDifficulty` 1–5 on progression entries | Yes — independent of mastery |
| Stages INTRODUCE→RETAIN | Yes |
| `selectProgressionContent({ preferredDifficulty })` | Soft filter exists; underused |
| Teaching Style SIMPLIFIED/BEGINNER | Presentation HOW only |
| Grade-school product lane | Isolated (`elementaryMode`) — not ULE depth |
| Prerequisites | Soft Orchestrator hints — not content start selection |
| Deep packs | CS inheritance, SQL, linear equations, parts of nursing/networking |

## Audit answers (summary)

1. Multi-level: CS/SQL/math-linear (+ partial nursing/networking/finance)
2. Thin singles: most domain-expansion + many writing/science
3. Difficulty ⊥ mastery: Yes
4. Beginner/mid/advanced via difficulty+stage+contentId (no universal level enum required)
5. Learner level ≠ mastery — ConceptMastery is truth
6. Prerequisites hint only
7. Orchestrator underuses preferredDifficulty
8. Grade-school isolated; Teach-Me-5 is universal presentation
9. Missing: ladders for thin concepts
10. Meta/UI: wiring preferredDifficulty
11. Breadth ≫ depth: domain-expansion
12. Reuse activities: Yes

## Smallest plan

1. `preferredDifficultyFromSignals` helper (evidence + style soft; age never overrides)
2. Thread `preferredDifficulty` through resolveLearningExperience + activities GET
3. One representative multi-level pack for a thin concept family
4. Tests + E2E · no GRADE_GAP / AGE_GAP · no second curriculum graph
