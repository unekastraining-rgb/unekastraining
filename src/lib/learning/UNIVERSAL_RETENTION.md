# UNIVERSAL_RETENTION — 2P-38

**LUCKY** remains the retention experience. ConceptMastery remains ULE truth.

## Role

```
Evidence → ConceptMastery → Orchestrator (diagnosis)
Adaptive COMPLETED → weak-mastery RetentionItem bridge → LUCKY
Lucky submit → RETAIN LearningAttempt → ConceptMastery → Orchestrator
```

Lucky selects among **legal RetentionItems**; it does not diagnose.

## Contract

- `RetentionReason` / `RetentionCandidate` — `src/lib/learning/retention/types.ts`
- Selection — `candidates.ts` (deterministic, capped, no mastery invention)
- Variants — `variants.ts` (same concept, different context; misconception-aware pick)
- Friendly copy — `reason-copy.ts` (never shows `RETENTION_GAP`, etc.)

## Candidate sources (unchanged bridges)

1. Missed quiz questions  
2. Due flashcards (SM-2 authoritative on card)  
3. Weak retain &lt; 0.45 with reviewCount ≥ 1  
4. Adaptive COMPLETE handoff (tags `ADAPTIVE_COMPLETION`)

Orchestrator `RETENTION_GAP` / `RECALL_GAP` still route to SIX active-recall — they do **not** create Lucky items.

## Variation & miss loop

Miss → schedule sooner → prefer different concept next → on return prefer a **different variant** when catalog has one. Score-only feedback; no answer dump.

## Evidence integrity

Open/view/GET Lucky ≠ LearningAttempt. Submit only creates RETAIN evidence.

## Long-horizon (2P-52)

See [`LONG_HORIZON_RETENTION.md`](./LONG_HORIZON_RETENTION.md) for due/upcoming/overdue read-side states, success spacing ladder, and over-review guards. Same RetentionItem engine — no FSRS / cron / decay subsystem.

## Deferred

FSRS for RetentionItem; Orchestrator-fed planner; TUTOR_FLAG/MASTERY_DECAY writers; RETAIN ladder for every concept; answer reveal in Lucky.
