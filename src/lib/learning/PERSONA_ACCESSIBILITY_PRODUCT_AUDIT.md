# 2G-70 WS19 — Persona / Accessibility Product Audit

**Status:** AUDIT + structural hooks

## Existing

`LearnerProfile`: persona, ageBand, educationLevel, goalsJson, modalityPreferencesJson, accessibilityPreferencesJson, settingsJson  
`getOrCreateLearnerProfile` — existence for evidence bridges; prefs largely unused by ULE selection.

## Shipped

| Piece | Path |
|-------|------|
| Safe presentation hooks | `persona-accessibility-hooks.ts` |
| Tests | `persona-accessibility-hooks.test.ts` |

Hooks adapt **presentation** only — never diagnosis, evidence, or mastery. Sensitive attribute keys filtered. No second learning engine.

## Deferred

- Wire hooks into Adaptive / Hub surfaces
- Prefer learner-authored prefs over inference

**Maturity:** FOUNDATION hooks.
