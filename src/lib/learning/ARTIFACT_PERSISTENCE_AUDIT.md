# ARTIFACT_PERSISTENCE_AUDIT — 2P-50

## Existing (keep)

- CORE `Note.contentJson` + ~900ms autosave + optional 409 stale
- SketchLayer / InfiniteCanvas `resolveCanvasCssSize` + ResizeObserver
- TouchChromeGuard / pointer pen+touch
- Activity artifacts transient until submit → LearningAttempt
- Production E2E already covers stale_note

## Gaps addressed

1. Shared persistence contract + save-status honesty  
2. Local draft on failed/conflict save  
3. Note-backed multi-file projects (no DB migration)  
4. Project API + navigator  
5. Canvas / evidence / device docs + tests  
6. Cross-file save isolation tests  

## Not invented

- Second document model / artifact engine / ProjectMastery  
- Native iOS / Pencil SDK  
- Automatic evidence from edits  
