# Teaching Style (2P-19)

## Why it exists

Learners need control over **how** an explanation is phrased without changing:

- **why** they are learning (`LearningIntent`)
- **what** interaction the Tutor runs (`TutorMode`)
- **what the learner needs** (`Learner Model` / Orchestrator)

Teaching Style is an **optional presentation layer** on the Unified Tutor.

## Conceptual model

```text
Learning Intent          → WHY
      ↓
Tutor Mode               → WHAT interaction
      ↓
Teaching Style           → HOW to communicate
      ↓
Tutor Response
      ↓
Learner Interaction
      ↓
Evidence / Mastery
```

Teaching Style does **not** replace Tutor Mode.

## Distinction

| Concept | Role |
| --- | --- |
| Learning Intent | Why the learner is engaging (UNDERSTAND, PRACTICE, …) |
| Tutor Mode | Interaction behavior (TEACH_ME, SOCRATIC, PRACTICE, …) |
| Teaching Style | Communication / explanation characteristics |
| Learner Model | Authoritative learner state for Orchestrator |

## Available styles

| Style | Learner-facing label |
| --- | --- |
| `SIMPLIFIED` | Teach Me Like I'm 5 |
| `BEGINNER` | Beginner |
| `STANDARD` | Standard |
| `DETAILED` | Detailed |
| `SOCRATIC` | Socratic |
| `FEYNMAN` | Feynman |
| `HANDS_ON` | Hands-On |
| `CHALLENGE` | Challenge |
| `EXAM` | Exam |

## Teach Me Like I'm 5

Internal style: **`SIMPLIFIED`**.

Means:

- maximum simplification
- low assumed prior knowledge *for this explanation*
- gradual terminology
- everyday analogies
- delayed abstraction
- technical correctness preserved

Does **not** mean:

- learner is a child
- grade/persona change
- childish UI
- wrong technical model
- lowered mastery standards

## Precedence

```text
explicit request/selection
  → session-held style (sessionStorage)
  → stored preference (when present)
  → explicit phrase in message ("like I'm 5", "detailed version", …)
  → absent (existing Tutor behavior)
```

No age or intelligence inference from struggle/evidence. Message hints only match clear style phrases.

## Session behavior

Style may change mid-session. Concept, intent, TutorMode, history, evidence, Adaptive run remain intact. Only presentation guidance changes.

Client `sessionStorage` key `studyhaul.teachingStyle` lets the same optional style travel across SIX Tutor, CORE Source Chat, and Teach Me without resetting chats.

## Entry-Point Propagation

| Entry | Status | Notes |
| --- | --- | --- |
| Foundation `/api/study/tutor` | SUPPORTED | Body + NL hint |
| SIX Tutor | SUPPORTED | UI + adapter + route |
| CORE Assist | SUPPORTED | UI + adapter; not Note.contentJson |
| Teach Me evaluate | SUPPORTED | Feedback phrasing; score via evaluate-bridge |
| Facade constructors | SUPPORTED | Optional field |
| Adaptive coordinator | NOT_APPLICABLE | Does not call runTutor |
| LUCKY | NOT_APPLICABLE | Retention, not Tutor |
| Blurting / SIX step evaluate | NOT_APPLICABLE | Not Unified Tutor paths |
| Hub Chat | NOT_APPLICABLE | Not on runTutor |

See `TEACHING_STYLE_PROPAGATION_AUDIT.md` for the full audit.

Cross-entry: selecting SIMPLIFIED in SIX, then opening CORE Source Chat, hydrates the same session style (optional). Starting a new browser session clears it.

Adaptive / CORE / SIX / LUCKY boundaries: style never becomes diagnosis, note document truth, SIX intervention identity, or retention scoring.

## Orchestrator boundary

Style is applied **after** legal intervention selection. It does not change diagnosis (`UNDERSTANDING_GAP`, etc.).

## Mastery / evidence boundary

Style does not write evidence, change LearningAttempt outcomes, or alter ConceptMastery. AI explanations are never learner-authored evidence.

## Accessibility / persona

Independent axes:

- Teaching Style = how explanation is expressed
- Accessibility = how content is presented/accessed
- Persona = existing personalization hooks

`Adult + SIMPLIFIED + dyslexia-friendly` is valid.

## AI boundary

AI may simplify, analogize, scaffold, and question. No AI detector. No silent promotion of AI text to learner evidence.

## Universal-domain rule

One Tutor + one style contract. Domains differ by content/`subjectDomain` only — never `JavaTeachingStyleEngine` / `NursingTeachingStyleEngine`.

## Default

`teachingStyle` omitted → existing Tutor behavior unchanged.
