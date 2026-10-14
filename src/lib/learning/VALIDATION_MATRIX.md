# VALIDATION_MATRIX — 2P-51

| Capability | Environment | Result label |
|------------|-------------|--------------|
| Typecheck | Local / CI | VERIFIED |
| Prisma validate | Local / CI | VERIFIED |
| Learning vitest | Local / CI | VERIFIED |
| Focused 2P-51 unit | Local / CI | VERIFIED |
| Production build | Local / CI | VERIFIED |
| Full vitest | Local | PARTIALLY VERIFIED (6 known fails) |
| Ownership E2E | Chromium desktop | VERIFIED (existing suites) |
| CORE / project E2E | Chromium desktop | VERIFIED (2P-50) |
| Responsive E2E | Chromium tablet/mobile viewport | PARTIALLY VERIFIED |
| WebKit / Firefox | — | NOT VERIFIED (not in default matrix) |
| Physical iPad / Safari | — | NOT VERIFIED |
| Live AI providers | — | NOT VERIFIED in CI |
| Live LMS OAuth | — | NOT VERIFIED in CI |
| Accessibility (axe) | — | NOT VERIFIED |
| Distributed rate limit | — | NOT VERIFIED / DEFERRED |
| Password multi-tenant auth | — | NOT VERIFIED (passwordless limitation) |

## Known full-suite unit failures (pre-existing)

| File | Count | Class |
|------|-------|-------|
| `src/lib/schedule/weekly-college-grid.test.ts` | 3 | PRE-EXISTING / non-ULE |
| `src/lib/lms/course-info/highlights.test.ts` | 3 | PRE-EXISTING / non-ULE |

Do not mark the full suite green while these remain.

## Browser matrix (this phase)

| Browser | Status |
|---------|--------|
| Chromium desktop | PARTIALLY VERIFIED (E2E suites) |
| Chromium tablet/mobile viewport | PARTIALLY VERIFIED |
| WebKit | NOT VERIFIED |
| Firefox | NOT VERIFIED |
