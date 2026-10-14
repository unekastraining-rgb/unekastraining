# 2P-2 — CORE / iPad Reliability + Real Note-to-Learning Workflow

**Mode:** Audit + targeted reliability hardening. No CORE rewrite.  
**Predecessors:** 2P-1 real learner flow · 2E/2G Knowledge bridge · prior iPad blank-ink mitigations.

---

## Executive Summary

CORE is **usable** as the knowledge workspace: `Note.contentJson` round-trips, SketchLayer already mitigates many iPad 0×0 blank-ink cases, Knowledge → Continue Learning → Adaptive is wired without writing mastery on edit.

**Proven product breaks fixed in 2P-2:**

1. Stale `saveNote` after `setDoc` could persist pre-edit content (lost clears / races).
2. Save path called `ensureNotebookPages` hydrate-merge, which could **resurrect cleared ink**.
3. Continue Learning left CORE without flushing in-memory note edits.
4. No reliable CORE ← Adaptive return to the same notebook.
5. InfiniteCanvas lacked SketchLayer-grade 0×0 / resize hardening.
6. Failed saves were silent.

---

## CORE architecture currently in use

| Layer | Implementation |
|-------|----------------|
| Document truth | `Note.contentJson` → `NoteDocument` (`note-types.ts`) |
| Multi-page | `metadata.notebookPages` + active-page top-level mirror |
| Workspace | `CoreNotesWorkspace` + `CoreNotesWorkspaceMount` |
| Ink | `SketchLayer` + `useInkHistory` |
| Whiteboard | `InfiniteCanvas` (`doc.canvas`) |
| History | `useDocumentHistory` + `useInkHistory` |
| Knowledge | `CoreKnowledgeBridgePanel` → `/api/core/knowledge/bridge` |
| Learning | Continue Learning → `/api/study/adaptive/start` |

---

## Note.contentJson contract

Canonical shape: `NoteDocument` JSON (tool, typed/typedHtml, strokes, notebook chrome, format payloads, `metadata.notebookPages`).

| Concern | Behavior | Status |
|---------|----------|--------|
| Parse | `parseNoteDocument` shallow merge with `emptyDocument` | PASS WITH NOTES |
| Invalid JSON | Falls back to `{ ...emptyDocument(), typed: raw }` — never throws | PASS |
| Empty/null | `emptyDocument()` | PASS |
| Legacy single-page | Synthesized page from top-level via `getNotebookPages` | PASS |
| API validation | String stored as-is (no Zod) | PASS WITH NOTES |
| Hydrate on open | `ensureNotebookPages` merges page data so ink is not blank | PASS |
| Save | `prepareNoteDocumentForSave` = `syncCurrentPage` (live wins, including clears) | PASS (fixed) |

---

## Note load/render lifecycle

```text
SSR/load → parseNoteDocument → ensureNotebookPages → replaceDoc + sketchInk.replaceStrokes
→ SketchLayer paints (even in type mode when strokes exist)
```

Remount key: `CoreNotesWorkspaceMount` `key={initialNote?.id}`.

---

## Note save lifecycle / Autosave

| Trigger | Behavior |
|---------|----------|
| Manual Save | `saveNote()` |
| Autosave | 900ms debounce on doc/title/tool/… |
| Page switch | `docOverride` + skip next autosave |
| Before Adaptive | `flushNoteBeforeAdaptive` (new) |

Hardening: `docRef` + save generation (`shouldApplySaveResult`) so newest save wins; save errors surface via `data-core-save-error`.

---

## Undo/redo

Protected. Document history + ink history + PDF annotate preference in `undoCore`/`redoCore`. Not replaced. Tests assert hooks and wiring remain.

---

## Canvas initialization / sizing / pointer

| Area | Status |
|------|--------|
| SketchLayer page-sheet measure | PASS |
| Math.max(1) + DPR clamp | PASS |
| ResizeObserver + rAF second paint | PASS |
| touch-action / non-passive preventDefault while inking | PASS |
| Pencil SDK | Not present — browser pointer/stylus only |
| Auto Pencil-only on pen detect | Intentionally disabled (noop) |
| InfiniteCanvas 0×0 / RO | PASS WITH NOTES (hardened in 2P-2) |
| pageOrientation → layout | PARTIAL (stored UI preference; desk metrics ignore) |

---

## Drawing persistence

draw → `sketchInk` + `doc.strokes` → autosave/manual → `prepareNoteDocumentForSave` → PATCH → reopen hydrate.

Stroke empty-mirror gate prevents hydrate wipe on remount. Clear-page now passes `docOverride` through save path that does not resurrect ink.

---

## Mobile / iPad / Desktop

| Area | Desktop | iPad/Tablet | Mobile | Data Integrity | Status |
|------|---------|-------------|--------|----------------|--------|
| Note open/render | SUPPORTED | SUPPORTED | PARTIALLY SUPPORTED | contentJson | PASS WITH NOTES |
| Sketch ink | SUPPORTED | SUPPORTED | PARTIALLY SUPPORTED | strokes | PASS WITH NOTES |
| Whiteboard canvas | SUPPORTED | PARTIALLY SUPPORTED | PARTIALLY SUPPORTED | doc.canvas | PASS WITH NOTES |
| Autosave / flush | SUPPORTED | SUPPORTED | SUPPORTED | race-hardened | PASS |
| Undo/redo | SUPPORTED | SUPPORTED | SUPPORTED | hooks intact | PASS |
| Knowledge bridge | SUPPORTED | SUPPORTED | SUPPORTED | owned concepts | PASS |
| CORE → Adaptive | SUPPORTED | SUPPORTED | SUPPORTED | flush + return | PASS |
| CORE Assist/Tutor | SUPPORTED | SUPPORTED | SUPPORTED | no mastery on chat | PASS |
| Pencil SDK | N/A | INTENTIONALLY LIMITED | N/A | pointer path | PASS WITH NOTES |

---

## Knowledge bridge / CORE → Adaptive

```text
CORE note → preview candidates → user confirm → owned Concept
→ Continue Learning → flush save → POST /api/study/adaptive/start
→ Adaptive run (?fromNote=) → activity → evidence → mastery
→ Back to notebook (/core?noteId=)
```

Ordinary edit/create/chat does **not** create mastery. Client evidence intent cannot authorize Tutor writes.

---

## CORE Assist / Tutor boundary

CORE Assist adapter forces `evidenceIntent: "none"`. Public Tutor route forces none on write. Meaningful Tutor evidence remains gated (not expanded in 2P-2).

---

## Failure / recovery states

| State | Behavior |
|-------|----------|
| Malformed contentJson | Typed fallback; no crash; no silent erase of valid JSON |
| Empty note | Valid emptyDocument |
| Save failure | Visible alert; in-memory edits retained |
| Canvas 0×0 | Provisional 1×1 + remeasure on RO/rAF |
| Missing concept / Adaptive start fail | Error on CTA; note remains |
| Knowledge bridge disabled | Hint; no fabricated concepts |

---

## Bugs found

| Bug | Class | Severity | Action |
|-----|-------|----------|--------|
| Stale saveNote after setDoc | DATA LOSS | P0 | Fixed — docRef + docOverride |
| ensureNotebookPages on save resurrects clears | DATA LOSS | P0 | Fixed — prepareNoteDocumentForSave |
| Continue Learning without flush | DATA LOSS | P0 | Fixed — onBeforeLeaveToAdaptive |
| No Back to notebook after Adaptive | NAVIGATION | P1 | Fixed — fromNote + sessionStorage |
| InfiniteCanvas raw 0×0 | UX / iPad | P1 | Fixed — buffer helpers + RO |
| Silent save failure | UX | P2 | Fixed — save error banner |
| pageOrientation unused by layout | PARTIAL | P2 | Deferred |
| No dirty/beforeunload on Hub leave | UX | P2 | Deferred (Adaptive path flushed) |

---

## Fixes made

| File | Fix |
|------|-----|
| `notebook-pages.ts` | Export hydrate merge; add `prepareNoteDocumentForSave` |
| `canvas-buffer-size.ts` | Pure measure + save-generation helpers |
| `CoreNotesWorkspace.tsx` | docRef, save gen, clear override, flush, save error |
| `CoreKnowledgeBridgePanel.tsx` | Flush before Adaptive; return note session + href |
| `CoreStudioPanel` / `CoreSidePanel` | Wire `onBeforeLeaveToAdaptive` |
| `SketchLayer.tsx` | Use shared measure helpers |
| `InfiniteCanvas.tsx` | 0×0-safe buffer + ResizeObserver |
| `AdaptiveSequenceRunShell` + adaptive page | Back to notebook / fromNote |
| `core-adaptive-bridge.ts` | `coreNotebookReturnHref`, `coreAdaptiveRunHrefWithReturn` |

---

## Deferred issues

1. Full dirty-state / beforeunload when leaving CORE via Hub (non-Adaptive).
2. Wire `pageOrientation` into desk layout metrics.
3. Zod validation on notes PATCH (additive only if needed).
4. Unbounded ink history growth.
5. Promote Writing/Game/Project Adaptive coverage (out of scope).
6. Live Tutor meaningful-evidence UI wiring (security-gated; out of scope).

---

## Test coverage

| Test | File |
|------|------|
| A–E, K contentJson / clear / measure | `src/lib/core/core-ipad-reliability.integrity.test.ts` |
| F undo/redo wiring | `src/hooks/core-history.integrity.test.ts` |
| G–J bridge / flush / return | `src/lib/learning/core-ipad-reliability.bridge.test.ts` |

---

## Verification

| Check | Result |
|-------|--------|
| Focused 2P-2 integrity + bridge + history | **20 passed** (10+7+3) |
| `core-adaptive-bridge.test.ts` + `ink-engine.test.ts` | **19 passed** |
| `src/lib/learning` full suite | **111 files / 1175 tests passed** |
| `src/lib/core` suite | **121 passed**; **1 pre-existing** empty suite fail (`resolve-core-course-id.test.ts`) |
| ESLint (primary 2P-2 files listed above) | **clean (exit 0)** |
| ESLint CoreNotesWorkspace / CoreStudioPanel / InfiniteCanvas unused | **pre-existing** warnings/errors (not introduced as new architecture) |
| `tsc --noEmit` | **3 pre-existing** baseline errors unchanged |
| New failures from 2P-2 | **none** |
---

## Architecture confirmation

- CORE remains the primary knowledge workspace  
- Note.contentJson remains the document truth  
- No second document / Knowledge / Learner / mastery / evidence model  
- CORE → SIX → LUCKY preserved  
- CORE → Adaptive remains additive  
- Ordinary CORE editing does not create mastery  
- Existing editor tools, undo/redo, templates preserved  
