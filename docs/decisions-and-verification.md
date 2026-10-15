# Decisions and Verification Register

[Documentation index](README.md). Updated October 15, 2026. These are unresolved choices and evidence gaps, not proposed additional features. The documentation describes agreed scope; it does not imply implementation readiness.

## Resolved

- Convex retained; cloud development/MCP access verified.
- Permanent basic/advanced groups and student identities; no classes/yearly accounts.
- Name codes with duplicate suffixes; explicit admin login changes allowed.
- Admin username/password login replaces Google sign-in.
- Browser Python first, lightweight beginner/advanced learning libraries, Chromebook constraints.
- Whitespace-insensitive checks, assignment-specific partial rules, up to 1,000 observed loop iterations.
- Direct teacher entry with notification, simultaneous editing/named cursors, Run/guidance/help alerts.
- Return/edit/resubmit for any completion result until cutoff; all attempts remain visible.
- Admin change history included; separate backup system excluded.
- Managed hosting, no domain/frontend hosting; 50 concurrent/1,000 lifetime students.

Resolved on October 15, 2026 by approving the **CodeCS Basic v2** design ([`design/`](../design/CodeCS%20Basic%20v2.dc.html)):

| ID | Decision |
| --- | --- |
| D01 | Each day has a cover image shown on the lesson page and a slides link (Canva or Figma Slides) that opens in a new tab. Slides are presented live in class; students can reopen them anytime. No slide upload/embed. |
| D05 | Turn-in closes **14 days** after the lesson date at **11:59 pm**, school time zone **America/Los_Angeles** (Pacific). Both values live in Settings. Unscheduled days show “Not scheduled” and have no turn-in close. |
| D06 | Changing a lesson date moves the turn-in close for that day’s assignments (the close is derived from the date and Settings). |
| D07 | Written feedback is optional and student-visible; a separate private note is visible to admins only. Reviewing never extends the cutoff. |
| D10 | Mint palette with amber/coral/violet status colors (violet = teacher), Open Sauce Sans with Geist Mono for code, light and dark themes, editor dark by default, designed for a 1366×768 Chromebook viewport. |
| D11 | Attendance is Present, Late or Absent per student per lesson date (the group’s lesson schedule), separate from online presence. |

## Product decisions requiring input

| ID | Decision | Needed before |
| --- | --- | --- |
| D02 | Forgotten-password recovery and in-app admin provisioning (interim: the developer creates admins with `npx convex run admins:createAdmin`) | Release |
| D03 | Spreadsheet columns/formats and stable returning-student match key | Roster import; avoid merging same-name people |
| D04 | Future lessons available immediately versus admin release | Publication/student day list |
| D08 | Published edits applied to existing work and any re-evaluation | Versioned assignment publication |
| D09 | Resubmitting before an earlier attempt is returned | Submission lifecycle; approved rule covers after-return work |
| D12 | Frontend provider, domain choice, and account ownership | Release |

Do not silently invent approved defaults. Independent implementation work can proceed while the relevant decision remains pending.

## Engineering choices and evidence needed

| ID | Work item | Required evidence |
| --- | --- | --- |
| V01 | Browser runtime/package selection | Python fundamentals, lightweight modules, files/imports, repeated runs, compatible package installs |
| V02 | School device/network | Cold/repeated startup and runtime/database/package/slide access on actual school Chromebook/network |
| V03 | Stop and loop counting | Busy/infinite loops stop without UI freeze; nested loops and multiple/zero prints do not confuse iterations with lines |
| V04 | Collaboration/presence/restores | Two browsers converge; disconnects, concurrent edits/restores preserve work |
| V05 | Remote Run routing | Correct version/actor; explicit busy/offline/late-result behavior |
| V06 | Auth integration/access | Hashes/sessions; negative student/admin access tests; recovery consistent with D02. **Oct 15:** Convex Auth chosen (student `ConvexCredentials` + admin `Password`); sign-in round trips and refusals pass in `convex-test`; not yet exercised against the deployed backend |
| V07 | File/slide storage | Durable uploads/resume/download; appropriate ownership/access; actionable failures. **Oct 15:** workspace files are text rows (`workFiles`), not Convex file storage; upload/download of `.py/.txt/.csv/.json` with size limits and readable refusals built; not yet tested on a Chromebook |
| V08 | Persistence/submission retry | No false saves; no duplicate attempts; immutable snapshots survive edits/moves. **Oct 15:** autosave shows Saved only after the save mutation resolves, keeps edits through failures/disconnects, and restores add versions without deleting any (unit and `convex-test` evidence); submissions not built yet |
| V09 | Capacity/provider plan | 50-student active-use checks plus admins; estimated retained files/versions/API use |
| V10 | UI usability/accessibility | Keyboard/focus/contrast, panel resizing, Chromebook viewport, output flood |
| V11 | Tooling readiness | Correct ESLint integration, generated route types, passing lint/typecheck/build |
| V12 | Release readiness | Correct backend/env, auth origins, hosting headers/assets, domain and smoke test |

SDK installation and documentation examples are not evidence of working application features. Pyodide remains a technical decision within scope, subject to compatibility tests.

## Checks performed — October 15, 2026 (Phase 3 editor and persistence, macOS)

| Check | Result |
| --- | --- |
| Convex codegen + function typecheck | Passed (`npx convex codegen --typecheck enable`); nothing pushed to a deployment |
| Lint | Passed with no warnings/errors |
| Typecheck | Passed (`npm run typecheck`) |
| Production build | Passed; `/learn/assignments/[assignmentId]` partially prerendered as before |
| Unit/integration tests | `npm test`: 34 passed. New: 8 `convex-test` workspace tests (starter files become v1 and reopening returns the same workspace; drafts and other curricula refused while a student's own past work opens; another student's workspace refused for save, versions, version and restore, plus anonymous and admin callers; autosave adds at most one version per 2 minutes; a save over another tab's change keeps it in history; restore adds a checkpoint and a `restore` version and leaves every earlier version unchanged; file name/size/duplicate rules) and 9 autosave-engine tests (not Saved until the save resolves, max-wait saving while typing, retry with backoff, no retry for refused saves, offline state, own-save echo, merge/conflict rules, server removals, flush) |
| Browser check (harness) | Editor rendered with a temporary harness page on a production build at 1366×768 (page removed afterwards): Geist Mono 500 15/26 px, 52 px gutter, design syntax colors on `--code-bg`; Enter auto-indents 4 spaces; switching files keeps each file's text; Saving… → ✓ Saved, Save failed · Retry → automatic retry → Saved, and Offline · changes kept all observed |
| Browser check (live, dev deployment) | After the developer pushed, set auth keys, created an admin and seeded `tidy-firefly-410`, the production build was served on localhost:3101 and the developer signed in as `jsmith`. Countdown opened Jordan's seeded v14 with “✓ Saved”, task, expected output and turn-in close; Versions listed v14 and inspecting it showed the read-only view. Loop art created a workspace (v1 “start”, empty `main.py`); typed code reached `workFiles` exactly (checked with `npx convex data`); `+` refused “my shapes” with a readable message and created `shapes.py`; uploading `shapes.csv` added and saved it, while `scores 2026.csv`, a 150 KB `big.txt` and `picture.png` were refused with messages; Download produced `shapes.csv` with the same text; a reload restored all three files; an autosave checkpoint v2 appeared about 3 minutes after v1; restoring v1 added v3 (pre-restore work) and v4 “Restored v1” and removed the extra files; restoring v3 brought all files back as v5; editing afterwards saved without a conflict notice or extra version; the header Day link waited for a running save before leaving. The unload handler cancels unload only while unsaved, but the pane's scripted navigation skips the browser's “Leave site?” prompt, so the prompt itself was not seen and an edit made just before that scripted reload was lost. Fixed during the check: type tag alignment in the header, element ids duplicated by Next keeping a left workspace mounted, Python highlighting on non-`.py` files, upload message for wrong file types |
| Dark editor fix | The build compiles `light-dark()` into variables resolved where tokens are declared, so `.scheme-dark` regions (editor, code views) had been rendering light colors. Tokens are now declared on `:root, .scheme-dark` in `app/globals.css`; verified dark in the browser |
| Development deployment | Pushed by the developer (`npx convex dev --once`), then auth keys, an admin and the seed were set up. The check left a Loop art workspace for `jsmith` (5 versions, 3 files). Someone else signed in as `jsmith` (the developer or another session) also created a workspace with `print("Hello")` and an empty `helpers.py` on a third assignment during the check; it is not from this check |
| Production data | Not inspected or modified |
| Device/load tests | Not performed |

Scenario 5 (save/resume/disconnect) now has unit and `convex-test` evidence for autosave, offline buffering and restore; it is not marked passed end to end.

## Checks performed — October 15, 2026 (Phase 1 structure, macOS)

| Check | Result |
| --- | --- |
| Convex codegen + function typecheck | Passed (`npx convex codegen --typecheck enable`) |
| Lint | Passed with no warnings/errors |
| Typecheck | Passed (`npm run typecheck`) |
| Production build | Passed; 17 routes, dynamic `[id]` routes partially prerendered |
| Unit/integration tests | `npm test`: 17 passed — login-code suffixes, student code and admin password sign-in round trips, wrong password, refused admin sign-up, anonymous/student/admin access refusals, drafts hidden from students, reassignment keeps identity and historical group, duplicate-code refusal, change history entry, Pacific turn-in close incl. DST, partial rule |
| Browser check | Login screen rendered at 1366×768 in light and dark and matched the design. Live student/admin screens not yet checked in a browser: the backend had not been pushed to the dev deployment at the time |
| Development deployment | `tidy-firefly-410` is the personal dev deployment of team member Prithvi Konduru in team `code-cs`. Push, auth env vars, admin creation and seeding are run by a developer (see [deployment](deployment.md)) |
| Production data | Not inspected or modified |
| Device/load tests | Not performed |

Scenarios 1, 2, 3, 4 and 11 below have unit-test evidence for the parts built in Phase 1 only; none is marked passed end to end.

## Checks performed — October 14, 2026 (documentation task, Windows)

| Check | Result |
| --- | --- |
| Frontend/source inspection | Starter page/metadata; no student/admin implementation |
| Convex MCP status | Success; dev `tidy-firefly-410`, prod `moonlit-alpaca-771` listed read-only |
| Development tables/functions | Empty; no application backend deployed |
| Package inspection | Next.js and ESLint config 16.4.0, React 19.3.0, Convex 1.46.0, ESLint 10.12.0, TypeScript 6.0.3, Node types 24.19.2 |
| Lint | Passed with no warnings/errors; generated Convex SDK files excluded |
| Typecheck | Passed after route type generation; `npm run typecheck` generates types before checking |
| Route type generation | Passed outside the Windows sandbox; restricted execution previously failed with access denied (os error 5) |
| Production build | Passed; starter `/` and `/_not-found` routes generated |
| Dependency versions | Registry checked; TypeScript stays on 6 because the lint parser rejects 7; Node types match the installed Node 24 runtime |
| Dependency compatibility | Next.js supports ESLint 10; bundled import, JSX accessibility, and React plugins still declare older peer ranges and cause npm peer warnings |
| Clean install check | `npm ci` reached installation but Windows refused to replace a locked `esbuild.exe` (EPERM); dependencies restored from npm cache and checks rerun, but clean installation remains unverified in this running workspace |
| Dependency security audit | Five high-severity findings from the `braces` → `micromatch` → `fast-glob` → Next.js lint dependency chain; latest braces is 3.0.3 with no patched release available. npm's suggested ESLint-config downgrade recreates the loading failure |
| Production data | Not inspected or modified |
| Device/product/load tests | Not performed; features remain unimplemented |

Documentation link/coverage/whitespace checks do not change product verification status.

## Required implementation scenarios

1. Duplicate names remain distinct; returning rosters preserve identity across years.
2. Basic/advanced changes preserve and correctly label historical work.
3. Student ownership and admin-only actions are enforced in the backend.
4. Correct guided/project work opens; drafts stay private.
5. Save/resume/disconnect behavior preserves edits without false success.
6. Assignment-specific thresholds and whitespace normalization yield explainable outcomes.
7. Loop/output floods stop; runtime restart preserves files/history.
8. Direct assistance notifies; edits/cursors synchronize; help and guidance retain context.
9. Turn-in captures saved files; retries/concurrent edits preserve distinct snapshots.
10. Return/resubmit works for all results before cutoff; latest attempt remains unreviewed until reviewed.
11. Time-zone boundaries/date changes follow D05/D06; closed turn-in retains editing/history.
12. Published changes preserve earlier snapshots/results according to D08.
13. Admin history records actors/changes without secrets.
14. Slides/files/packages work under supported device/network conditions.
15. Active concurrent use meets the stated capacity.

Mark scenarios passed only after the feature exists and evidence is recorded.
