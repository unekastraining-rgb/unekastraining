# LANGUAGE_WORKSPACE_IMPLEMENTATION_REPORT — 2P-41

## 1. Audit

See `LANGUAGE_WORKSPACE_AUDIT.md`. Universal text game/writing cover English↔Spanish
cognates/SVA. Notes have mic/STT for productivity only. No activity speech runtime,
TTS, or pronunciation scoring existed.

## 2. Specialization decision

Add thin `language` adapter (mirror math/networking). Authoritative evaluation =
normalized phrase/choice match. Label PRONUNCIATION as **Speech match**. Always
offer typed fallback. No phoneme/accent claims.

## 3. Architecture

```
SPECIALIZED LANGUAGE INTERACTION (kind: language)
        ↓
 UNIVERSAL LEARNING ENGINE (recordEvidence → applyEvidenceToMastery)
        ↓
 LearningAttempt → ConceptMastery → Orchestrator → Adaptive → LUCKY
```

## 4. Files changed / added

**Added:** `activities/language/*`, `LanguageWorkspacePanel.tsx`,
`e2e/language-workspace.spec.ts`, audit/docs.

**Wired:** page/API KINDS, content-contract (`language_match`), intervention
capability, Adaptive completion, decision-loop keys, scaffolding, progression,
ActivityWorkspace, coverage/inventory tests.

## 5–9. Model / speech / evaluator / content / UI

8 EN↔ES challenges (SPEAK/LISTEN/CONVERSATION/PRONUNCIATION). Browser STT/TTS
optional UX. `evaluateLanguageActivity()`. Panel with typed fallback + honesty copy.

## 10–13. Evidence / mastery / Adaptive / Lucky

Submit-only `language_workspace_submit`. Facets RECOGNIZE/APPLY/SOLVE/PERFORM/RETAIN.
Adaptive-ready. Lucky via ConceptMastery only.

## 14–16. Privacy / a11y / security

No raw audio persistence from workspace. Typed fallback; aria-live; touch-safe.
Session authority; forgery keys stripped; `pronunciationQualityScore` always null.

## 17–18. Tests / E2E

| Suite | Result |
|-------|--------|
| Language unit | **9/9 pass** |
| Full `src/lib/learning` (E2E_MODE unset) | **147 files / 1632 tests pass** |
| Playwright `language-workspace.spec.ts` | **1/1 pass** (typed fallback; no physical mic claim) |

Note: With `E2E_MODE=1` leftover in the shell, 2 unrelated core-bridge flag tests fail
(bridge forced on). Not caused by 2P-41 code. Clean run without E2E_MODE: green.

## 19–22. Build / lint / types / Prisma

| Check | Result |
|-------|--------|
| `tsc --noEmit` | **0** (after TapHandler spread fix) |
| `npm run build` | **0** |
| ESLint owned paths | **0** |
| Prisma validate | **valid** |

## 23. Deferred

Phoneme scoring · accent · open AI conversation · CEFR · voice profiles ·
authentic audio assets · LanguageTutor · LanguageRetention.

## 24. Regressions

Existing language text game/writing preserved. Architecture integrity:
**One ULE · One Learner Model · One Knowledge · One Evidence · One Mastery ·
One Orchestrator · One Adaptive · One Retention · CORE → SIX → LUCKY**.
