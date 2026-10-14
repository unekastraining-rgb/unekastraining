# LANGUAGE_WORKSPACE_AUDIT — 2P-41

**Mode:** Specialize only where text rubrics cannot support speech/listening interaction  
**Rule:** One ULE · language is an interaction adapter · no LanguageMastery / LanguageRetention  
**Prior art:** 2P-39 math · 2P-40 networking  
**Honesty:** Capability claims must match measurable mechanisms

---

## What universal infrastructure already handles

| Concern | Status |
|---------|--------|
| Concepts, mastery, evidence, Adaptive, Lucky | ✓ |
| English↔Spanish **reading/writing** (cognates, SVA) via game/writing rubrics | ✓ (3 catalog items) |
| Progression keys `lang-es-cognates-*`, `lang-en-agreement-*` | ✓ |
| Scaffold / misconception tags on text language items | ✓ |
| Tutor (generic WHY/WHAT/HOW — not bilingual speaking) | ✓ |
| Notes mic capture (`MediaRecorder`) + Web Speech dictation + Gemini note STT | ✓ **notes only** — not activity spine |

## What specifically requires a language speaking/listening runtime

1. Prompt-to-speak / listen / constrained conversation interaction state  
2. Optional browser STT → normalized transcript (not phoneme scoring)  
3. Optional browser TTS playback for listening prompts (honest: synthetic speech)  
4. Deterministic evaluation of transcript / selected answer / accepted response sets  
5. Typed fallback when mic/STT unavailable — clearly labeled as typed practice  

## Speech capability honesty

| Capability | Verdict |
|------------|---------|
| Mic capture | Reusable pattern in notes; not wired to activities |
| Playback (TTS) | **Not present** — browser `speechSynthesis` can be added behind abstraction |
| Speech recognition | Browser Web Speech in notes only; unreliable cross-browser |
| Pronunciation / phoneme / accent | **Unsupported** — do not claim |
| Listening comprehension | Needs TTS or fixed audio; no assets today |

**v1 evaluation truth:** normalized **speech/typed match** against expected phrases — **not** “perfect pronunciation.”

## Selected language pair

**English ↔ Spanish (`en` / `es`)** — only pair with existing catalog support.

## Specialization boundary

| Universal | Language workspace |
|-----------|-------------------|
| Learner, concept, evidence, Adaptive, Lucky | Modes SPEAK / LISTEN / CONVERSATION / PRONUNCIATION |
| Orchestrator diagnosis | Recording/transcript/playback UI state |
| Facets RECOGNIZE…RETAIN | Deterministic phrase/intent match |

## Out of scope

Phoneme scoring · accent analysis · open conversational AI · CEFR engine · audio persistence · LanguageTutor · LanguageRetention.

**Audit complete — implement thin provider-independent contract + honest browser STT/TTS + typed fallback.**
