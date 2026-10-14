# Educational Market & Trading Simulation (2P-17)

> **Educational Simulation only.** Fake money · deterministic scenarios · offline fixtures.  
> **Not** a brokerage. **Not** real-money trading. **Not** financial advice.

**Architecture preserved:** CORE → SIX → LUCKY · one Orchestrator · one ConceptMastery · one Evidence spine · existing Simulation activity contract.

---

## 1. Purpose

Deepen the 2P-16 Finance seed into a meaningful **educational market/trading simulation** where learners make paper decisions, explain reasoning, and produce universal learning evidence — without creating a finance-specific learning system.

---

## 2. Educational boundary

| Allowed | Forbidden |
|---------|-----------|
| Fake / paper cash & positions | Brokerage APIs |
| Synthetic / fixture prices | Real trades / order routing |
| Deterministic scenarios | Deposits / withdrawals |
| Educational charts | Bank linking / payments |
| Decision journals (learning) | Financial advice product claims |
| Reasoning-based evaluation | “Guaranteed returns” |

Enforced in code: `boundary.ts`, scenario `realMoney: false` / `brokerage: false`, integrity fail on guaranteed-profit / real-brokerage language.

---

## 3. Existing architecture reused

| Layer | Reuse |
|-------|--------|
| Simulation activity | `structured/service.ts` kind `simulation` |
| Evaluation → evidence | `evaluateStructuredChallenge` → `recordAuthoritativeActivityEvidence` |
| Progression / coverage / experience / scaffolding | 2P-9 → 2P-12 |
| Adaptive bind | Existing Simulation Adaptive-ready contract |
| Orchestrator | Unchanged — not a financial advisor |
| ConceptMastery | Canonical — no FinanceMastery |

**No second simulation engine.** Market logic is **content + evaluation helpers** for Simulation.

---

## 4. Simulation contract

Module: `src/lib/learning/activities/simulation/educational-market/`

Supports scenario kinds: market/limit orders, supply/demand, position sizing, diversification, market events, hold-vs-chase, volatility risk.

Learner decision shape: action, quantity, order type, allocations, prediction, **required reasoning**, optional confidence / expected outcome.

---

## 5. Scenario model

Each scenario includes: identity, conceptKey, objective, prompt, deterministic `SimulationState`, success rules, reasoning keywords, scaffolds, misconceptions, outcome narrative, disclaimer.

Catalog size: **12 scenarios** (within 8–15 target).

---

## 6. Simulation state

```
cash, holdings, currentPrices, portfolioValue,
priceSeries, marketEvents, scenarioNotes
+ educationalOnly / realMoney:false / brokerage:false
```

Helpers: `makeEducationalMarketState`, `applySimulatedBuy` / `Sell` (paper only).

---

## 7. Content catalog

| ID | Concept | Kind |
|----|---------|------|
| `sim-market-order-edu` | market-orders | market_order |
| `edu-mkt-limit-order-patience` | limit-orders | limit_order |
| `sim-supply-demand` | supply-and-demand | supply_demand |
| `edu-mkt-supply-shock` | supply-and-demand | supply_demand |
| `edu-mkt-position-sizing-2pct` | position-sizing | position_sizing |
| `edu-mkt-position-oversize` | position-sizing | position_sizing |
| `edu-mkt-diversify-allocate` | diversification | diversification |
| `edu-mkt-diversify-concentration` | diversification | diversification |
| `edu-mkt-event-earnings` | market-events | market_event |
| `edu-mkt-event-rate-hike` | market-events | market_event |
| `edu-mkt-hold-vs-chase` | opportunity-cost | hold_vs_chase |
| `edu-mkt-volatility-risk` | volatility-risk | volatility_risk |

Merged into `STRUCTURED_CHALLENGES` as Simulation rows (`domainTag: finance`).

---

## 8. Progression

Progression ladders in `content-progression/catalog.ts` for market-orders, limit-orders, position-sizing, diversification, market-events, opportunity-cost, volatility-risk (plus existing supply-and-demand).

Stages PRACTICE / APPLY / CHALLENGE used; Orchestrator still decides interventions.

---

## 9. Variation

Same concept, different contentIds / contextVariants / difficulty (e.g. position sizing APPLY vs CHALLENGE). Uses existing `selectProgressionContent` / coverage filters.

---

## 10. Scaffolding

ALWAYS disclaimer constraint + ON_REQUEST hints/steps. Progressive via existing ScaffoldPanel. Hints do not reveal answer keys.

---

## 11. Evaluation

`evaluateEducationalMarketSubmission`:

1. Parse structured decision (JSON) or limited free-text
2. Require meaningful reasoning
3. Score success rules (objective alignment) + reasoning keywords
4. **Reject** guaranteed-profit / real-brokerage language
5. **Do not** use simulated P&L as mastery proof

Wired: `evaluateStructuredChallenge` routes market IDs to this evaluator.

---

## 12. Evidence mapping

Unchanged path: submit → server evaluation → `recordAuthoritativeActivityEvidence` → LearningAttempt → ConceptMastery.

Facets: APPLY / SOLVE / EXPLAIN per scenario. payloadRef includes `contentId` + objective.

---

## 13. ConceptMastery

Canonical only. No TradingMastery / FinanceMastery / PortfolioMastery.

---

## 14. Adaptive integration

Simulation remains Adaptive-ready. Lifecycle:

Concept → finance content → coverage → experience → Simulation → decision → evaluation → LearningAttempt → ConceptMastery → Orchestrator → next Adaptive step.

Orchestrator is **not** a financial advisor.

---

## 15. Chart experience

`projectEducationalMarketChart` + SVG in `EducationalMarketPanel`: educational price path + event markers. Explicitly **not** a trading terminal.

---

## 16. Decision journal

Optional fields: expected outcome, confidence. Serialized with decision artifact. `educationalOnly` + `notFinancialAdvice`. No separate advisory persistence layer.

---

## 17. Universality test

**Can existing Simulation + Content + Evaluation + Evidence + ConceptMastery + Orchestrator represent this?**

**Yes.** Interaction = structured paper decision + reasoning text. Specialized engine **not** required for 2P-17.

Gap for later (optional): live multi-step state machine UI / streaming quotes — still educational-only if ever added; never brokerage.

---

## 18. Cross-activity integration

| System | Coexistence |
|--------|-------------|
| SIX | Explain market order / supply-demand |
| Tutor | Concept explanation |
| Quiz / Flashcard | Terminology recognition / retention |
| CORE | Notes → Concept → Adaptive Simulation |
| LUCKY | Retain weak finance concepts |
| Adaptive | Simulation bind unchanged |

No Finance-specific forks of these systems.

---

## 19. Security / product boundary

- No brokerage APIs in module sources (tested)
- No payment / deposit / withdraw infrastructure
- Offline fixtures only — no live market dependency
- UI marks `data-real-money="false"` `data-brokerage="false"`

---

## 20. Future enhancements

- More scenario packs (options education, bonds) still on Simulation
- Richer multi-step paper portfolio runs
- Optional delayed classroom data feeds (**still not brokerage**)
- Chart annotations tied to misconceptions

---

## 21. Deferred work

- Professional trading terminal UX
- Live broker connectivity
- Real-money anything
- FinanceMastery tables
- Mass scenario generation
- Writing Adaptive for finance essays

---

## 22. Architecture risks

| Risk | Mitigation |
|------|------------|
| Learners confuse sim with real trading | ALWAYS disclaimer + integrity fail language |
| Profit mistaken for mastery | Explicit `profitIsNotMastery` evaluation |
| Second engine creep | Universality test; stay on Simulation |
| Live API dependency | Fixture-only scenarios |

---

## UI

- `EducationalMarketPanel` in Activity Workspace when challenge is educational market
- API GET `/api/study/activities/simulation` attaches `marketState` + `marketChart`
