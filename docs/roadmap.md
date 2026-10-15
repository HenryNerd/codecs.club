# Implementation Roadmap

[Documentation index](README.md). Updated **October 15, 2026**. This orders the agreed features into phases. It adds no new scope; feature rules stay in the other guides.

The visual reference is the Claude Design project **CodeCS Basic v2**, saved at [`design/CodeCS Basic v2.dc.html`](../design/CodeCS%20Basic%20v2.dc.html) (10 screens at 1366×768, light and dark). `support.js` and `image-slot.js` from that project are design-tool runtime only and are not part of the app.

## Phase 1 — Structure and sign-in (built)

| Area | What exists |
| --- | --- |
| Design system | Design tokens (mint palette, status colors, syntax colors) in `app/globals.css`; Open Sauce Sans + Geist Mono; light/dark/auto theme without a flash |
| Shared UI | `components/ui/*`: buttons, fields, segmented controls, tabs, pills, status labels, callouts, loading/empty/error states, read-only syntax-colored `CodeView` |
| Routes | Login `/`; student `/learn`, `/learn/days/[dayId]`, `/learn/work`, `/learn/assignments/[assignmentId]`; admin `/admin/students`, `/curriculum`, `/assignments`, `/assignments/[assignmentId]`, `/assistance`, `/review`, `/settings`, `/history` |
| Backend | Full Convex schema (`convex/schema.ts`), role checks (`convex/lib/access.ts`), login-code allocation, time-zone helpers, admin change history, seed of the design's sample school |
| Sign-in | Convex Auth: student login code (`ConvexCredentials`, rate-limited) and admin username/password (`Password`, sign-up refused; accounts created with `admins:createAdmin`) |
| Live screens | Learning home, Lesson day, Admin Students (roster, attendance, group/curriculum/login-code changes), Admin Curriculum (timeline, day content, lesson dates), Settings (read-only), History |
| Preview screens | Workspace, My work, Assignments editor, Assistance, Review render sample data from `lib/fixtures.ts` behind a visible “Preview” banner; nothing on them is saved |
| Tests | `npm test`: login codes, sign-in round trips, student/admin access refusals, reassignment history, turn-in close time zones, partial rule |

## Later phases

Each phase is its own piece of work. Screens move off fixtures as their phase lands; the fixture shapes already match the planned query results.

| Phase | Scope | Blocked on |
| --- | --- | --- |
| 2. Student path, live | My work from real workspaces/submissions/feedback; historical context labels; past-curriculum access | — |
| 3. Editor and persistence | CodeMirror 6 with the design's syntax theme (dark by default); multiple files, upload/download; debounced autosave with Saving/Saved/Failed and offline buffering; leave-page warning; version history inspect/restore | — |
| 4. Python runtime | Pyodide in a Web Worker; runtime states; Stop via interrupt buffer with terminate/restart fallback; batched output; micropip with clear unsupported errors; check cross-origin-isolation headers against storage images and slide links | V01–V03 device tests |
| 5. Guided evaluation | Whitespace-stripped part matching (begins / contains in order / ends / equals); partial rule; loop observation up to 1,000 iterations incl. nested loops; results tied to code version and revision; stale-result labels | V03 |
| 6. Turn-in and review | Idempotent snapshot submissions after a confirmed save; server-enforced cutoff; review queue, expected vs actual, optional student feedback and private notes, Mark reviewed, new-attempt states | D09 |
| 7. Admin content | Cover image upload (file storage); assignment authoring with revisions, drafts and publishing | D04, D08 |
| 8. Admin students | Roster import with preview; printable login tickets; history for every write | D03 |
| 9. Assistance | Presence (online/idle/offline); help requests and queue; seat assignment; join/leave notifications; collaborative editing with labeled cursors; guidance notes; attributed remote Run | V04, V05 |
| 10. Hardening and release | Settings editing; authorization audit; accessibility pass; Chromebook and school-network tests; 50-active-student load check; hosting and domain | D02, D12, V02, V09, V10, V12 |
