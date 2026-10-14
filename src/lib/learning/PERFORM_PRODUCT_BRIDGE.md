# 2G-70 WS9 — PERFORM Product Bridge

**Status:** FOUNDATION helpers only — no real PERFORM activity

## Design source

`PERFORM_ACTIVITY_BRIDGE_DESIGN.md` (2G-57 Option B)

## Shipped

| Piece | Path |
|-------|------|
| Contract helpers | `assessment/perform-evidence-contract.ts` |
| Tests | `perform-evidence-contract.test.ts` |

Envelope requires: `conceptId`, `skillFacet: PERFORM`, objective `outcome`, optional `score`, opaque `sourceRef` / `evidencePayload`.

## Explicitly not done

- No invented PERFORM activity
- Hands-on Practice remains APPLY (not PERFORM)
- Self-confidence rejected as PERFORM criterion
- **PERFORM_GAP not added** to Orchestrator

## Maturity

**FOUNDATION** — activity remains future work.
