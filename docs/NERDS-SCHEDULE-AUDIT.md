# The Nerd's Schedule — Phase 1 Audit

**Status:** Audit complete. No scheduling code shipped yet.  
**Goal:** Build *The Nerd's Schedule* as a planning layer over existing academic data — not a rebuild.

---

## Architecture rule

```
Existing Hub (unchanged)
      ↓
The Nerd's Schedule (new portal)
      ↓
College Academic Planner (engine + notebook UI)
```

Do **not** redesign the Hub. Do **not** duplicate Moodle, assignments, AI settings, or color templates.

---

## 1. What already exists

| Area | Status | Location |
|------|--------|----------|
| **Hub** | Mature shell — leave unchanged | `src/components/hub/AcademicHub.tsx` — tabs: Hub / Classes / Locker / Chat / Settings |
| **Classes / Courses** | Full CRUD + Moodle import | Prisma `Course`, Classes tab, `/courses` |
| **Moodle** | Collect → ingest → DB + `courseInfoJson` | `app/api/lms/moodle/*`, `src/lib/lms/moodle-import.ts` |
| **Syllabus** | Materials + AI enrich + important-dates portal | `CourseMaterial`, `src/lib/lms/course-info/*` |
| **Assignments** | Canonical deadlines (`kind`: ASSIGNMENT / TEST / QUIZ / PROJECT / …) | `Assignment`, `/api/assignments`, `/api/planner` |
| **Quizzes (practice)** | In-app AI quizzes — *not* LMS deadlines | `Quiz` model |
| **Exams** | Represented as `Assignment.kind = TEST` + calendar events | No separate Exam table |
| **Calendar** | Full workspace + Google sync | `/calendar`, `src/lib/calendar/*` |
| **Tasks** | Assignments *are* the task list | `HubAssignmentsPanel` |
| **Important dates** | Derived from `courseInfoJson` | `src/lib/lms/course-info/highlights.ts` — not a DB table |
| **Core** | NotebookLM-style notes | `/core` |
| **Ask** | Hub Chat tab (no `/ask` route) | `ChatTab` → `/api/chat` |
| **Study** | Six / Lucky / Study Now | `/study` |
| **Learning plans** | College + grade-school generators | `/api/courses/[id]/learning-plan` |
| **AI / Without AI** | Env keys + `aiSourceMode` in prefs | Offline chat fallback when AI off |
| **Color templates** | Global `--sh-*` + customization palettes | `ThemeProvider`, Settings |
| **Schedule proposals** | Heuristic only (urgent ≤3d → 45-min block) | `src/lib/schedule/proposals.ts` |
| **Task breakdown** | AI outline → flashcards/quiz (study topic) | `/api/study/break-down` |
| **Working hours** | Calendar UI grid only (default 7–22) | *Not* used by scheduler |
| **`/planner`** | Redirects to `/dashboard` | Stub |
| **`ScheduleTab`** | Orphaned, not wired into Hub | Dead code |

### Navigation today

- Hub planning pills: Hub · Study · Core · Calendar · Resources (`HubPlanningNav`)
- Portal pages use `HubBackBar` (back to Hub)
- Ask = Chat tab inside Hub, not a separate portal
- `/planner` → redirect `/dashboard`
- `?tab=schedule` maps to Hub for compatibility

---

## 2. EXISTS → REUSE

| Asset | Why |
|-------|-----|
| `Course`, `Assignment`, `CalendarEvent`, `ClassMeeting` | Source of truth for academic data |
| `courseInfoJson` / highlights | Term dates, important assessments, syllabus signals |
| `ScheduleProposal` + `/api/schedule/proposals` | Existing suggest/apply contract — extend, don't fork |
| `/api/calendar` unified items | Single read model for calendar-adjacent views |
| `/api/planner` + `HubAssignmentsPanel` | Assignment/task CRUD |
| Moodle ingest/sync | Keep importing; schedule recalculates from DB |
| `HubBackBar` + `HubPlanningNav` | Add a Schedule pill; do not redesign Hub chrome |
| `--sh-*` theme CSS variables | Notebook must adapt to user's color template |
| `Course.color` | Per-course visual identity on blocks |
| `isAIConfigured()` + app settings | Preserve With AI / Without AI |
| `Assignment.status`, `CalendarEvent.completed` | Preserve completion on recalculate |

---

## 3. NEEDS ENHANCEMENT → MODIFY

| Piece | Gap |
|-------|-----|
| `generateScheduleProposals` | No availability windows, Fri–Sun blackout, deadline buffers, course balance, or prep chains |
| `applyScheduleProposal` | Places blocks at `suggestedDate` with no free-slot search or conflict checks |
| Calendar `workingHoursStart/End` | Display/insights only — not fed into scheduling |
| `/api/study/break-down` | Topic study outline, not programming prep steps; filtered proposals often not persisted |
| Course term type | Start/end live in `courseInfoJson` only; **no accelerated vs full-semester flag** |
| `ScheduleChange` types | Only `study_block` / `reschedule_assignment` / `review_topic` |
| Planning nav | No entry for The Nerd's Schedule |

---

## 4. MISSING → BUILD

1. **The Nerd's Schedule portal** (`/schedule`) — separate from Hub and from general Calendar
2. **Academic coordinator engine** — fixed events → preparation blocks across Mon–Thu
3. **Availability profile** — work shifts Fri–Sun 6 AM–6 PM; preferred academic Mon–Thu 9 AM–1 PM
4. **Views:** Daily / Weekly notebook / Semester timeline / Upcoming / Workload / Overload
5. **Notebook planner UI** — college-ruled paper, red margin, spiral; theme-driven colors
6. **Overload detection** — warn + re-prioritize; never schedule Fri–Sun
7. **Deterministic (Without AI) path** — full schedule without AI
8. **Prep-step templates** for programming (requirements → implement → debug → submit)
9. **Accelerated-course logic** from term dates + optional pace field

---

## 5. DUPLICATE → DO NOT BUILD

- Second Assignment / Course / Exam / Moodle / AI / theme / task-list systems
- Redesign of Hub layout or Hub tab set
- Parallel calendar event store when `CalendarEvent` (`STUDY_SESSION` + `assignmentId`) works
- New Core notebook engine (reuse aesthetic patterns / CSS vars only)
- Revive `/planner` as a competing product surface
- Hard-coded assignment dates for CSCI 1250 / OOD / Intro to Business

---

## 6. Proposed scheduling algorithm

### Inputs (reuse existing data)

- Assignments + `kind` + due dates + status
- Class meetings
- Calendar events (including completed study sessions)
- Course highlights / term start–end from `courseInfoJson`
- Availability preferences (new settings blob; see DB section)

### Hard constraints

- **Friday–Sunday** = work shifts (6 AM–6 PM) → **zero** academic blocks
- Prefer **Monday–Thursday 9:00 AM–1:00 PM** (~16 preferred hours/week)
- Only schedule the work actually needed (do not fill all 16 hours)
- Overflow academic blocks only Mon–Thu outside 9–1 when a heavy week requires it
- **Never** solve overload by scheduling Fri–Sun

### Pipeline (deterministic first — works Without AI)

1. Collect **FIXED** items (assignment deadlines, exams/tests, quiz closes, class meetings, important dates)
2. Score priority: kind → days remaining → accelerated pace → unfinished prep → programming weight
3. Expand major items into **PREPARATION** steps (rule templates; AI may refine later)
4. Place steps backward from deadline with **1–2 academic-day buffer** when capacity allows
5. Pack into free Mon–Thu slots; balance courses; avoid back-to-back heavy coding blocks
6. After accelerated courses end → redistribute spare capacity toward CSCI 1250
7. If demand > capacity → overload warning + deprioritize lower-impact work
8. Persist prep as `CalendarEvent` (`STUDY_SESSION`) linked via `assignmentId`; **keep `completed` on recalc**

### Fixed vs preparation

| Fixed (cannot move) | Preparation (schedulable) |
|---------------------|---------------------------|
| Exam / quiz close / assignment deadline | Read / review / practice |
| Project deadline / required class meeting | Start / continue / debug / test |
| Assessment | Study for exam / final review / submit buffer |

### Programming prep template (CSCI 1250 & OOD)

1. Understand requirements  
2. Review relevant material  
3. Plan solution  
4. Begin implementation  
5. Continue implementation  
6. Debug  
7. Test  
8. Review  
9. Submit  

Reuse existing decomposition ideas where possible; do **not** create a second task system — prep steps are schedule events linked to existing assignments.

### Priority order

1. Exams  
2. Major assessments  
3. Large projects  
4. Major programming assignments  
5. Quiz deadlines  
6. Smaller assignments  
7. Routine reading / modules  

Also weigh: due date, days remaining, estimated workload, course acceleration, grade weight if available, programming complexity, unfinished work.

### With AI (optional enhancement)

- Workload estimation  
- Richer assignment decomposition  
- Prioritization nuance  
- Study recommendations / difficult-week narration  
- Learning-plan recommendations  

AI must **not** be required for core schedule generation.

---

## 7. Proposed UI structure

```
Hub (unchanged)
  └─ Planning nav → "Schedule" (new pill)
        └─ /schedule  →  The Nerd's Schedule
              ├── Today (Daily) — "What do I need to do today?"
              ├── This Week (Notebook week)
              │     ├── Mon–Thu: academic blocks
              │     └── Fri–Sun: WORK SHIFT 6 AM–6 PM (protected)
              ├── Semester (master timeline Aug–Dec)
              ├── Upcoming Deadlines
              ├── Study Blocks / Course Workload
              ├── Task Breakdown
              ├── Important Academic Dates
              └── Accelerated sticky (from real course dates)
```

### Daily task card fields

- Course  
- Task  
- Task type  
- Duration  
- Priority  
- Due date  
- Related assignment / exam / module  
- Completion status  

### Notebook aesthetic

- College-ruled horizontal lines  
- Notebook paper tint  
- Red vertical margin line  
- Spiral binding / spine  
- Handwritten / marker-inspired typography  
- Clearly separated days  
- Highlighted study blocks  
- Accelerated sticky note (dynamic from course dates)  

**Colors must follow the user's existing color template** (`--sh-*`). Do not hard-code a fixed pink/blue/yellow/green palette that ignores theme changes.

### Course color semantics (derived from theme + `Course.color`)

| Course / type | Family |
|---------------|--------|
| Object-Oriented Design / Programming | Blue-family |
| CSCI 1250 | Pink-family |
| Intro to Business / Online modules | Yellow-family |
| Homework / Labs | Green-family |

Set/update `Course.color` from theme-harmonized values — do not invent a second independent color system.

---

## 8. Proposed theme integration

1. Notebook paper, accents, highlights, sticky notes, headers, buttons, selected states, borders → bind to `var(--sh-*)` and soft mixes (`--sh-primary-soft`, `--sh-accent-soft`, etc.)
2. Course blocks → `Course.color` (semantic differentiation)
3. Prefer global Study Haul theme over forking calendar `--cal-*` for notebook chrome
4. When the user changes color template in Settings, The Nerd's Schedule updates automatically

Key existing theme files:

- `src/lib/theme/ThemeProvider.tsx`
- `src/lib/theme/templates.ts`
- `src/lib/customization/apply-palette.ts`
- `app/globals.css` (`--sh-*` tokens)
- Settings → Colors & templates

---

## 9. Database / settings changes (minimal)

| Change | Why |
|--------|-----|
| **Prefer no new Assignment / Course / Exam / Task tables** | Planning layer over existing data |
| Optional: extend prefs / calendar settings with `academicAvailability` | Persist work shifts + preferred Mon–Thu windows |
| Optional: `Course.pace` (`FULL_SEMESTER` \| `ACCELERATED`) or derive from `courseInfoJson` start/end | Accelerated vs full-semester logic |
| Optional: light metadata on `CalendarEvent` for prep step labels | Distinguish prep steps; `assignmentId` already links to source |
| Avoid new ImportantDate model | Already derived from portal / assignments |

### Sync rule

When Moodle changes a due date / quiz close / exam / course date / calendar event:

1. Recalculate affected preparation blocks  
2. **Do not delete completed work**  
3. Preserve completion status  

---

## 10. Active courses (runtime data — do not hard-code dates)

Schedule around these three courses using **imported** Moodle / syllabus / calendar data:

1. **CSCI 1250 — Intro to Computer Programming** — Full semester (August–December)  
2. **Object-Oriented Design** — Accelerated (August–October)  
3. **Intro to Business** — Accelerated (August–October)  

No seed fixtures for these courses exist in-repo. Live Moodle import is the source. Assignment dates must come from DB, not hard-coded UI.

---

## 11. Implementation phases

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Scheduling / data audit | **Done (this document)** |
| 2 | Scheduling engine + availability constraints | Pending approval |
| 3 | The Nerd's Schedule portal + nav pill | Pending |
| 4 | Notebook planner UI | Pending |
| 5 | Theme / color-template integration | Pending |
| 6 | Task breakdown (extend existing; no second system) | Pending |
| 7 | Overload detection | Pending |
| 8 | AI enhancements (optional layer) | Pending |
| 9 | Testing with the three live courses | Pending |

---

## 12. Final product checklist

When open, The Nerd's Schedule should answer:

- **TODAY:** What do I need to do?  
- **THIS WEEK:** What needs to get done?  
- **UPCOMING:** What is approaching?  
- **SEMESTER:** What does the entire semester look like?  
- **Coordinator question:** What should I do *today* so I am not scrambling at the deadline?

Constraints to respect:

- Real work schedule (Fri–Sun protected)  
- Accelerated courses prioritized Aug–Oct without starving CSCI practice  
- Existing Hub / AI / themes / Moodle data unchanged at the architecture level  

---

## File reference (highest-value reuse)

| Path | Role |
|------|------|
| `src/components/hub/AcademicHub.tsx` | Hub shell — do not redesign |
| `src/components/hub/HubPlanningNav.tsx` | Add Schedule pill |
| `src/components/hub/HubBackBar.tsx` | Portal chrome for `/schedule` |
| `src/lib/schedule/proposals.ts` | Extend generate/apply engine |
| `app/api/schedule/proposals/route.ts` | Proposal API |
| `app/api/planner/route.ts` | Assignment-as-task API |
| `app/api/calendar/route.ts` | Unified calendar |
| `src/lib/calendar/unified-items.ts` | Calendar read model |
| `src/lib/calendar/settings.ts` | Working hours prefs (extend) |
| `src/lib/calendar/time-insights.ts` | Capacity signals for overload |
| `src/lib/lms/moodle-import.ts` | Moodle → Course/Assignment |
| `src/lib/lms/course-info/highlights.ts` | Important dates / term bounds |
| `app/api/study/break-down/route.ts` | Existing breakdown (extend carefully) |
| `src/lib/theme/*` + `globals.css` | Theme tokens |
| `prisma/schema.prisma` | Course / Assignment / CalendarEvent / ScheduleProposal |

---

*Generated as Phase 1 deliverable for The Nerd's Schedule. Approve this approach before Phase 2 implementation.*
