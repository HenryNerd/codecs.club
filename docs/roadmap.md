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
| Preview screens | My work, Assignments editor, Assistance, Review render sample data from `lib/fixtures.ts` behind a visible “Preview” banner; nothing on them is saved (the Workspace went live in Phase 3) |
| Tests | `npm test`: login codes, sign-in round trips, student/admin access refusals, reassignment history, turn-in close time zones, partial rule |

## Phase 3 — Editor and persistence (built)

| Area | What exists |
| --- | --- |
| Editor | CodeMirror 6 (`components/workspace/CodeEditor.tsx`) with Python highlighting, 4-space indent, bracket matching/closing, search and undo per file; theme from the design's `--k/--f/--s/--n/--c/--o` and `--code-*` tokens (`editorTheme.ts`), dark by default via `.scheme-dark` |
| Workspace screen | `/learn/assignments/[assignmentId]` is live: task and expected output, file tabs, Files and Versions panels, turn-in close date and attempt count. Run, Stop, Packages, Check, Turn in and Ask for help render disabled (“Not available yet”) for Phases 4–6 and 9 |
| Files | Add (`+`, name checked as you type it), switch, upload (`.py/.txt/.csv/.json`, confirm before replacing) and download the shown file. Limits: 20 files, 100 KB per file, 400 KB per workspace (`convex/lib/workFiles.ts`, enforced on both sides) |
| Backend | `convex/workspaces.ts`: `get` (task + working copy), `open` (creates the workspace from the published starter files as v1), `saveFiles` (autosave; per-file revisions), `versions` (paginated), `version`, `restore`. Students only, caller derived from the session, someone else's workspace reads as not found, drafts and other curricula never open (a student's own past work still does) |
| Autosave | `lib/workspaceSync.ts`: 0.8 s debounce, at most 4 s during continuous typing, one save in flight. Header shows Saving… / ✓ Saved / Offline · changes kept / Save failed · Retry; “Saved” only after the mutation resolves. Failed saves keep the edits and retry with backoff (2 s doubling to 30 s) and on reconnect; invalid saves wait for the next edit. Saves on tab hide and when leaving; full page unloads with unsaved work trigger the browser warning; in-app links wait for a running save or ask when offline/failed |
| Versions | A version is added at most every 2 minutes while saving, plus v1 starter code. Restore first snapshots unsaved-to-history work, then adds a `restore` version recording `restoredFrom`; nothing is deleted. A save over a change made in another tab keeps that change as a version first |
| Schema | Additive only: `workFiles.revision` (optional), `workVersions.reason` gains `"start"`, `workVersions.restoredFrom` (optional) |
| Tests | `npm test`: workspace ownership refusals (save/versions/version/restore), drafts and other curricula refused, starter copy as v1, checkpoint spacing, restore keeps history, cross-tab overwrite kept in history, file rules; autosave engine states, retry, offline, echo/merge rules |

## Phase 4 — Python runtime (built)

| Area | What exists |
| --- | --- |
| Runtime | Pyodide **314.0.7** (Python 3.14.2) in a module Web Worker (`lib/python/python.worker.ts`). The core is self-hosted from `public/pyodide/314.0.7/` (copied from the npm package); optional packages load on demand from the matching jsDelivr release. Python starts loading when a workspace opens and is shared by every workspace in the tab |
| Build | `scripts/prepare-python.mjs` (runs before `dev`/`build`, or `npm run python:build`) copies the runtime and bundles the worker with esbuild to `public/python/worker.js`. Next's bundler starts workers as classic scripts, which Pyodide refuses |
| Run | Runs `main.py` if present, else the shown `.py` file, using the editor's current text. Each run starts from a fresh namespace with exactly the workspace's files on disk, so edited modules reload and deleted files disappear. Tracebacks hide runner frames and show `main.py`-relative file names |
| Stop | Site-wide `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: credentialless` give the worker shared memory. Stop writes SIGINT to the interrupt buffer; if Python hasn’t stopped within 2 s (or the page isn’t isolated) the worker is restarted and the output says variables were cleared. Files are never affected |
| input() | Blocks the worker on a shared buffer; the Output panel shows an input line, echoes the typed text after the prompt, and Stop cancels the wait. Without isolation, input() prints a clear message and gets no input |
| Output | Batched in the worker (every 50 ms or 16 KB), at most 2 MB forwarded per run; the panel keeps the newest 200 KB and says when output was trimmed or the limit was reached. Errors in coral, typed input in mint; footer shows Running / Finished / Stopped with an error / Stopped after N s |
| Packages | Packages popover installs with micropip; failures are explained (compiled code not available, not found, offline). Installed packages are saved on the workspace (`workspaces.packages`, `workspaces.setPackages`) and reinstalled before runs after a restart. Pyodide-built packages imported by the code (e.g. numpy) load on demand. Package progress shows in its own status line, not in program output |
| Schema | Additive only: `workspaces.packages` (optional string array) |
| Tests | `npm test`: real Pyodide in Node (output, module reload, fresh runs, tracebacks, syntax errors, input(), exit codes, interrupting an infinite loop, the default lesson modules), output batching and trimming, runtime client Stop/restart/input/load-failure paths with a fake worker, package-list ownership and validation |

## Phase 5 — Guided evaluation (built)

| Area | What exists |
| --- | --- |
| Rules | `convex/lib/evaluation.ts`: whitespace-insensitive begins / contains in order / ends / equals, readable reasons for unmet parts, completion / partial (assignment minimum) / no completion, outcome explanations. Shared by Convex and the UI (`lib/evaluation.ts` re-exports it) |
| Loop observation | `lib/python/runner.ts`: with the infinite-loop check on, loop bodies get counters (also in imported workspace files); outermost loops stop after 1,000 rounds as a planned stop (`"limit"`), never an error |
| Check flow | Run check (guided only) saves, calls `checks.prepare` (pins the saved files as a version; adds a “Checked” version only when needed), runs in check mode (check input fed to `input()`, 10 s limit, printed output captured), then `checks.record` evaluates on the server against the published revision and stores parts, outcome, run outcome and the start of the output |
| Check panel | Latest result with “for vN · time”, met / not yet with reasons, the overall explanation, notes for error / loop limit / timeout, and a stale notice when the code or task changed since |
| Schema | Additive only: `workVersions.reason` gains `"check"`; `checkResults.runOutcome`, `output`, `outputTruncated`; `assignmentRevisions.checkInput` |
| Seed | Countdown's first part is now `begins "10"` (so the design's count-by-2 bug is partial); Forever greeter and Mad libs get check input. Existing deployments keep their seeded parts |
| Tests | Evaluation rules incl. the design's examples; loop observation with real Pyodide (exactly 1,000 rounds, rounds not lines, nested and silent loops, imported modules, line numbers kept, no counters left for normal runs); runtime check capture/limit/timeout/stop; Convex check flow (version pinning and reuse, server evaluation, stale after edits, loop input, open-ended / other student / foreign version / changed task refused) |

## Later phases

Each phase is its own piece of work. Screens move off fixtures as their phase lands; the fixture shapes already match the planned query results.

| Phase | Scope | Blocked on |
| --- | --- | --- |
| 2. Student path, live | My work from real workspaces/submissions/feedback; historical context labels; past-curriculum access | — |
| 3. Editor and persistence | Built (see above); checked live against the dev deployment on October 15, 2026 | — |
| 4. Python runtime | Built (see above); checked live against the dev deployment on October 15, 2026. Still needs Chromebook/school-network tests | V01–V03 device tests |
| 5. Guided evaluation | Built (see above); checked live against the dev deployment on October 15, 2026 | — |
| 6. Turn-in and review | Idempotent snapshot submissions after a confirmed save; server-enforced cutoff; review queue, expected vs actual, optional student feedback and private notes, Mark reviewed, new-attempt states | D09 |
| 7. Admin content | Cover image upload (file storage); assignment authoring with revisions, drafts and publishing | D04, D08 |
| 8. Admin students | Roster import with preview; printable login tickets; history for every write | D03 |
| 9. Assistance | Presence (online/idle/offline); help requests and queue; seat assignment; join/leave notifications; collaborative editing with labeled cursors; guidance notes; attributed remote Run | V04, V05 |
| 10. Hardening and release | Settings editing; authorization audit; accessibility pass; Chromebook and school-network tests; 50-active-student load check; hosting and domain | D02, D12, V02, V09, V10, V12 |
