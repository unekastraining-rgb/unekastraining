# 2G-71 WS D — SQL Activity Product

**Status: PRODUCT-READY** (educational sql.js only)

## Lifecycle

SQL problem → learner SELECT → in-memory educational DB → objective compare →  
Evidence → LearningAttempt → ConceptMastery (PERFORM)

## Safety

- SELECT/WITH only
- Multi-statement rejected
- DROP/DELETE/UPDATE/INSERT/ALTER/… rejected
- No production DB / no external connections

## Surfaces

- `/api/study/activities/sql`
- `/study/activities/sql`
