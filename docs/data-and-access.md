# Data, Identity, and Access

[Documentation index](README.md). As of October 15, 2026 the schema (`convex/schema.ts`), authentication and Phase 1 functions are implemented in source; see the [roadmap](roadmap.md) for which features use them.

## Persistence and conceptual data relationships

Convex is the required persistent backend. The conceptual records below map to tables in `convex/schema.ts` (table names in the last column). Having a table does not mean the feature using it is built.

| Record | Responsibility | Table(s) |
| --- | --- | --- |
| Student | Persistent identity, name code, imported roster data, current group/curriculum | `students` (+ `users`) |
| Admin | Username, credential hash/authentication records, and authorized teaching/management access | `admins` (+ `users`, Convex Auth tables) |
| Group | The two persistent values: basic and advanced | `"basic" \| "advanced"` field |
| Curriculum / Day | Learning sequence, topics, cover image, slides link, assignment relationships | `curricula`, `days` |
| Lesson Schedule | Year-specific lesson dates and associated turn-in timing | `lessonSchedules` |
| App Settings | Admin-editable approved behavior, including turn-in timing configuration | `settings` |
| Assignment | Guided/open-ended task, publication state, named requirements, expected checks, and assignment-specific partial-completion rule where applicable | `assignments`, `assignmentRevisions` |
| Student Work | Student files, autosave state, environment details, assignment and historical context | `workspaces`, `workFiles` |
| Work Version | Recoverable prior files with creator/time context | `workVersions` |
| Submission | Final saved snapshot, submission time, assignment/schedule context | `submissions` |
| Guided Check Result | Requirement-level outcomes and overall classification tied to the specific work version and evaluation-rule version | `checkResults` |
| Feedback | Teacher response tied to reviewed work (student-visible) | `feedback` (`visibility: "student"`) |
| Review Note | Admin-only note associated with student work or review | `feedback` (`visibility: "private"`) |
| Help Request | Student, assignment, alert and resolution state | `helpRequests` |
| Assistance / Guidance | Teacher participation and assignment-context messages | `assistSessions`, `guidanceNotes` |
| Attendance | Present/Late/Absent per student per lesson date | `attendance` |
| Admin Change | Acting admin, timestamp, affected record, and relevant prior/new values | `adminChanges` |

Persistence requirements:

- References use stable student identity, not the student's changeable current curriculum.
- Current group/curriculum and historical assignment context are separate so reassignment cannot relabel old work.
- New yearly schedules cannot overwrite old submissions, work versions, or dates.
- Saved results must identify the code version checked; stale results must not imply that new edits have been evaluated.
- Concurrent teacher/student edits and restores must converge without silent data loss.
- Completed work and former-student access persist for the website's lifetime.
- Admin change history is required. A custom database/file backup feature or separate backup system is outside the approved scope.
- Retain the approved name-code student login flow for this small-scale deployment; changing it to a password-based student flow is not required.

## Identity and persistence invariants

- Use stable internal student IDs for work relationships, not the login code or current group.
- First-initial-plus-last-name codes receive numeric suffixes for collisions across current and former students in both groups. Preserve issued codes across years unless explicitly changed by an admin.
- Roster name matches alone must not silently merge people. Decide a stable import match key before importing returning students.
- Validate student ownership and admin privileges at backend entry points, not only through navigation.
- Autosave acknowledgment means persistence succeeded; pending edits and concurrent revisions need explicit reconciliation.
- Turn-in uses saved snapshots. Retry must not duplicate submission attempts; later edits cannot mutate prior snapshots.
- Results identify code and evaluation-rule versions; feedback identifies the submission reviewed.
- Admin changes record actor, time, affected records, and relevant prior/new values, excluding passwords/secrets.
- App authentication is separate from the developer CLI/MCP account. It uses Convex Auth: students sign in with a login code (`ConvexCredentials` provider `student`, rate-limited per code and site-wide for unknown codes); admins sign in with username and password (`Password` provider, scrypt hash, public sign-up refused). Admin accounts are created with the internal `admins:createAdmin` function.
- Every public function derives the caller from the session (`convex/lib/access.ts`: `requireAdmin`, `requireStudent`) and never accepts an identity argument. Client route guards only choose what to render.
- Student workspace files (including uploaded `.py/.txt/.csv/.json`) are text rows in `workFiles`, with whole-workspace snapshots in `workVersions`; limits in `convex/lib/workFiles.ts` keep a snapshot under the 1 MiB document limit. Define how cover images and other binary assets use Convex file storage when those features are built. Validate access before exposing protected files.

See [pending decisions](decisions-and-verification.md) for roster matching, account recovery, and versioned assignment editing. No custom backup system is included; required version history and admin change history are separate behaviors.

## Official implementation references

[Authentication](https://docs.convex.dev/auth/overview), [password configuration](https://labs.convex.dev/auth/config/passwords), [password hashing](https://labs.convex.dev/auth/api_reference/providers/Password), [file storage](https://docs.convex.dev/file-storage/overview).

Read `convex/_generated/ai/guidelines.md` before writing Convex code. Recheck auth-library compatibility when upgrading `@convex-dev/auth` (0.0.96 as of October 15, 2026).
