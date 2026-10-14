# NETWORK_WORKSPACE_AUDIT — 2P-40

**Mode:** Specialize only where text rubrics cannot validate topology / connectivity state  
**Rule:** One ULE · networking is an interaction adapter · no NetworkMastery  
**Prior art:** 2P-39 math workspace (`activities/math/`)

---

## What universal infrastructure already handles

| Concern | Status |
|---------|--------|
| Concepts, mastery, evidence, Adaptive, Lucky | ✓ |
| DNS vs DHCP / authn vs authz **reasoning** via Lab/Sim text rubrics | ✓ (2P-36/37) |
| Retention variants for dns/auth concepts | ✓ (2P-38) |
| Progression ladders (`dns-troubleshooting`, `dhcp-troubleshooting`) | ✓ |
| Scaffolds / misconception metadata | ✓ |

Current path: free-text → keyword rubric. `sim-network-fault` `rules` metadata is **not** a runtime state machine.

## What specifically requires a network workspace

1. Mutable device / interface / link state  
2. Deterministic connectivity / DNS checks from that state  
3. Observe → diagnose → fix → verify without keyword essays  
4. Misconception signals from wrong-layer fixes (DNS when APIPA, etc.)

## Specialization boundary

| Universal | Networking workspace |
|-----------|----------------------|
| Learner, concept, evidence, Adaptive, Lucky | Topology fixtures & interface config |
| Orchestrator diagnosis | Constrained reachability / DNS checks |

## Safe additive path

Mirror math under `src/lib/learning/activities/networking/` + kind `"networking"`.

## Out of scope

Packet Tracer · real networks · attacks · OSPF/BGP/VLANs · packet capture · NetworkMastery.

**Audit complete — implement constrained educational topology troubleshooting only.**
