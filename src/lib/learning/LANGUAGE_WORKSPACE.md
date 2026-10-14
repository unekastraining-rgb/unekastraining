# LANGUAGE_WORKSPACE — 2P-41

## Why specialization was justified

Text game/writing rubrics already teach cognates and grammar *in writing*.
They cannot support speak / listen / constrained conversation interaction state,
optional browser STT/TTS, or honest speech-match evaluation. This workspace is a
**specialized interaction** on the ULE — not a second language engine.

## Boundary

| Universal | Language workspace |
|-----------|-------------------|
| Learner, Concepts, Evidence, Adaptive, Lucky | Modes SPEAK / LISTEN / CONVERSATION / PRONUNCIATION |
| Facets RECOGNIZE…RETAIN | Recording / transcript / playback UI state |
| Orchestrator | Deterministic phrase / choice / intent match |

## Supported language

**English ↔ Spanish (`en` / `es`)** — matches existing catalog support.

## Supported modes

- **SPEAK** — produce expected phrase (spoken transcript or typed)
- **LISTEN** — browser TTS play + multiple-choice (typed selection authoritative)
- **CONVERSATION** — constrained accepted-response set (not open AI chat)
- **PRONUNCIATION** — labeled **Speech match** only (not phoneme scoring)

## Speech capability (honesty)

| Claim | Supported? |
|-------|------------|
| Browser STT (optional UX) | Yes, when Web Speech API exists |
| Browser TTS example playback | Yes, when `speechSynthesis` exists |
| Transcript / typed phrase match | **Yes — authoritative** |
| Phoneme / accent / fluency score | **No** (`pronunciationQualityScore` always `null`) |
| Raw audio persistence | **No** — discard after local STT; nothing stored |

## Evaluator

`evaluateLanguageActivity()` — normalized exact match against approved variants,
or listen option id. Empty response / recording state alone → FAIL. No LLM authority.

## Normalization

Lowercase, trim, punctuation/whitespace; approved equivalents only. Does **not**
rewrite wrong grammar into correct grammar.

## Evidence

Open / play / record / transcript preview / hint → no LearningAttempt.  
Submit → `language_workspace_submit` → ConceptMastery.

Typed vs spoken distinguished via `responseChannel` in evidence payload.

## Adaptive / Lucky

Adapter `language` Adaptive-ready. Retention via existing 2P-38 ConceptMastery
eligibility — no LanguageRetention.

## Accessibility / fallback

Typed practice always available. Mic denial / STT unavailable → clear message,
no fake SUCCESS. Touch-safe controls; `aria-live` recording status; keyboard focus.

## Privacy

No raw audio upload from this workspace. Optional local browser STT only.

## Limitations / future work

Phoneme scoring · accent analysis · open conversational AI · CEFR · persistent
voice profiles · authentic recorded listening media · LanguageTutor.
