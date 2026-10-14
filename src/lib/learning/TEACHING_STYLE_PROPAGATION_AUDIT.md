# Teaching Style Propagation Audit (2P-20)

## Verdict

**PASS**

## 1. Tutor entry points inspected

Foundation Tutor API, SIX Tutor (UI/route/adapter), CORE Assist (UI/route/adapter), Teach Me evaluate (UI/route/adapter), facade constructors, Adaptive coordinator, LUCKY, blurting evaluate, SIX step evaluate, Hub Chat.

## 2. Propagation status

| ID | Status |
| --- | --- |
| foundation_tutor | SUPPORTED |
| six_tutor | SUPPORTED (already 2P-19) |
| core_assist | SUPPORTED (wired 2P-20) |
| teach_me | SUPPORTED (wired 2P-20) |
| facade_legacy_chat | SUPPORTED (wired 2P-20) |
| facade_demonstration | SUPPORTED (wired 2P-20) |
| adaptive_tutor_step | NOT_APPLICABLE |
| lucky | NOT_APPLICABLE |
| blurting_evaluate | NOT_APPLICABLE |
| six_step_evaluate | NOT_APPLICABLE |
| hub_chat | NOT_APPLICABLE |

Living inventory: `teaching-style/entry-points.ts`.

## 3. Gaps discovered

- CORE Assist accepted Unified Tutor but dropped `teachingStyle` (adapter + route + UI).
- Teach Me unified path dropped `teachingStyle`.
- Facade constructors lacked optional style.
- No shared client session key for cross-entry hydration.
- No explicit NL phrase → style helper (UI was primary).

## 4. Additive changes made

- CORE / Teach Me / facade passthrough of optional `teachingStyle`
- `TeachingStyleSelector` + sessionStorage on CORE Source Chat and Teach Me
- SIX already had selector; now shares session hydration
- `extractTeachingStyleHintFromMessage` + resolve precedence for clear phrases
- Foundation + SIX + CORE routes resolve body style or message hint
- Entry-point inventory + propagation tests
- Docs updates

## 5. Intentional non-supported paths

- **Adaptive coordinator**: selects interventions; does not call `runTutor`. Style applies when learner opens SIX Tutor UI.
- **LUCKY**: retention scoring path; no Unified Tutor.
- **Blurting / SIX step evaluate**: scoring paths without `runTutor`.
- **Hub Chat**: not migrated to `runTutor`.
- **Legacy AI paths** (feature flags OFF): style ignored until unified flag enabled — documented.

## 6. Session behavior

`sessionStorage` key `studyhaul.teachingStyle`. Changing style does not clear chat/messages/notes. Concept/intent/mode preserved.

## 7. Cross-entry behavior

Same browser tab session: SIX ↔ CORE ↔ Teach Me can hydrate the same optional style. New session → absent (default Tutor behavior). No DB preference subsystem.

## 8–16. Separations verified

| Boundary | Result |
| --- | --- |
| Intent | Independent; style does not rewrite purpose |
| Tutor Mode | Independent (e.g. GUIDED + SIMPLIFIED; SIX Feynman ≠ style FEYNMAN) |
| Learner Model | Style not a diagnostic |
| Orchestrator | No teachingStyle in diagnose |
| Evidence/Mastery | Tutor evidenceIntent unchanged; Teach Me still evaluate-bridge |
| Adaptive completion | Untouched |
| Accessibility | Independent axes |
| Domain | Same SIMPLIFIED contract across subjectDomain labels |

## 17. Tests

```bash
npx vitest run src/lib/learning
```

**Result:** 129 files / 1446 tests passed (includes `teaching-style/*.test.ts` + `propagation.test.ts`).

## 18. ESLint

```bash
npx eslint --max-warnings=0 <2P-20 owned paths>
```

**Result:** clean on teaching-style module, adapters, facade, routes, `TeachingStyleSelector`, `SixTutorChat`, `CoreSourceChat`.

`GuidedStudyActivity.tsx` still reports pre-existing `react-hooks/purity` / `set-state-in-effect` on unrelated `Date.now` / course-topic sync effects — not introduced by style wiring; left untouched (no scope creep).

## 19. TypeScript

```bash
npx tsc --noEmit
```

**Result:** no new errors under teaching-style / adapters / facade / Tutor routes / selector / CORE/SIX/Teach Me UI. Remaining `tsc` failures are baseline (e.g. notebook desk kinds, quiz offline fallback, resolve-loop-focus-topic) and unrelated to 2P-20.

## 20. Browser E2E

No harness — not run.

## 21. Deferred work

- Persist style as long-lived user preference (resolver already accepts `preference`)
- Hub Chat migration onto Unified Tutor (out of scope)
- Adaptive step chrome for style (only if Adaptive grows a direct Tutor step)

## 22. Architecture risks

- Unified feature flags OFF → style does not apply on legacy AI paths
- Message hints are phrase-based; ambiguous wording stays absent (by design)
- Teach Me style may influence feedback wording in JSON `summary`/`nextSteps` text; numeric score still produced by the same evaluate bridge — do not treat style as grading policy

## Architecture audit

Still **one** Tutor, Learner Model, Knowledge Model, Evidence, Mastery, Orchestrator, Adaptive.

No TeachingStyleEngine / Tutor2 / domain style engines.
