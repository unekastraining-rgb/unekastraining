# Study Haul — Authority Boundaries (Bundle L)

Concise developer map. Do not duplicate these responsibilities across systems.

| Authority | Owns | Does **not** own |
|---|---|---|
| **Knowledge Library** | What Study Haul knows (authored concepts, misconceptions, forms) | Learner evidence, scheduling, UI chrome |
| **Learning Studio** | Where teaching happens (TeachFirst, stage, curriculum path UI) | Retention scheduling, writing documents |
| **Six** | How learning is practiced (guided techniques) | Adaptive next-step decisions |
| **Haul** | Writing/creation loop + proposals | Adaptive teaching path |
| **Lucky** | Retention/review scheduling + variants | Curriculum path position |
| **Core** | Capture/organize/build notes & materials | Duplicate quiz/flashcard engines |
| **Learner Model** | What Study Haul knows about the learner | What to teach next (Orchestrator) |
| **Orchestrator** | Adaptive next step | When to study (Planner), capability discovery |
| **LAF / evaluate API** | Evidence/activity learning records | Fake client-side evidence without user |
| **Capability Registry** | What the learner can intentionally do (doors) | Knowledge content, adaptive decisions |
| **Planner** | When/where planned study & assignments | Adaptive diagnosis (Orchestrator) |

## Evidence (interactive Studio)

**Option B:** Local form evaluation → UI feedback only.  
`/api/study/evaluate` is the authoritative evidence writer for Learning Studio.  
`completeInteractiveActivityForStudio` requires a real `userId` for LAF evidence.

## Capability access

Many doors (Locker, Learning, Core, Course, Assignment, Planner) → one canonical implementation per capability via `capability-registry` + practice landscape / activity routes.

## Haul mode vs phase

- `doc.mode`: `learn` | `write` | `improve` — editing/tool surface  
- `HaulWritingPhase`: LEARN→PLAN→WRITE→FEEDBACK→REVISE→FINISH — workflow strip (inferred)
