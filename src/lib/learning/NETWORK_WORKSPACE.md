# NETWORK_WORKSPACE — 2P-40

## Why specialization was justified

Text Lab/Sim rubrics teach networking *reasoning* (DNS vs DHCP, authn vs authz).
They cannot validate mutable topology / interface / addressing state or a
deterministic observe→diagnose→fix→verify loop. This workspace is a
**specialized interaction** on the Universal Learning Engine — not a second engine.

## Universal vs specialized boundary

| Universal (ULE) | Networking workspace |
|-----------------|----------------------|
| Learner, Concepts/Skills, LearningAttempt | Topology fixtures & config |
| Facets RECOGNIZE…RETAIN, Orchestrator | Constrained reachability / DNS |
| AdaptiveSequenceRun, LUCKY retention | Fault fixtures & evaluation |

## Supported network model

- Nodes: `PC` \| `SWITCH` \| `ROUTER` \| `SERVER`
- Interfaces: name, IP, mask, gateway, DNS, enabled
- Links: from/to interface, enabled
- Initial fixture: **PC-A → Switch → Router → Server**

## Supported scenarios (7)

1. Disabled interface  
2. Incorrect IP  
3. Incorrect subnet mask  
4. Incorrect gateway  
5. DNS failure (IP ok, hostname fails)  
6. DHCP/APIPA failure  
7. Retain / gateway retrieval practice  

## Evaluator

`evaluateNetworkWorkspace(challenge, state, diagnosis)` — deterministic.
Checks required interface config, connectivity (and hostname when required),
diagnosis quality, misconception signals, score, facet, completion.

## Misconceptions (internal signals only)

`INTERFACE_STATE` · `SUBNET_MISUNDERSTANDING` · `GATEWAY_MISUNDERSTANDING` ·
`LOCAL_VS_REMOTE_CONNECTIVITY` · `DNS_VS_DHCP` — never raw names in learner UI.

## Scaffolding

Existing scaffold contract; `doesNotRevealAnswer: true` where applicable.
L1 inspect cue → L2 component category → L3 config category.

## Evidence mapping

| Interaction | LearningAttempt? |
|-------------|------------------|
| Open / select / inspect | No |
| Ping / hostname check / hint / reset | No |
| Submit | Yes → `network_workspace_submit` |

## Adaptive / LUCKY

Adapter key `networking` is Adaptive-ready. Retention uses existing 2P-38
ConceptMastery eligibility — no NetworkRetention.

## Accessibility

Topology + semantic device list, labeled forms, `aria-live` status, keyboard
focus, touch-safe controls, non-color-only state.

## Limitations / future work

Not Packet Tracer. No real networks, attacks, OSPF/BGP, VLANs, packet capture,
wireless, firewall, or unrestricted topology editing.
