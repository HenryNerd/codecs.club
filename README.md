# Code CS

A provider-hosted Python learning workspace replacing Colab for two persistent groups: basic and advanced. Students use persistent name codes; admins manage lessons, assignments, review, and remote assistance.

## Status

Phases 1–8 of the [roadmap](docs/roadmap.md) are built: the design system from the approved **CodeCS Basic v2** design, every student and admin route, the Convex schema, sign-in (student login codes and admin passwords via Convex Auth), and the student workspace with a CodeMirror editor, autosave, version history, Python that runs in the browser (Pyodide: Run, Stop, `input()`, packages), guided checks that compare output with the task (whitespace ignored, partial completion, endless loops watched for 1,000 rounds), and turn-in: saved snapshots as attempts, enforced turn-in close, and resubmission before review. The learning home, lesson day, admin roster/attendance, curriculum scheduling and Review (queue, submitted snapshot, expected vs actual, optional feedback and private notes, Mark reviewed) read live Convex data. My work reads live saved work, all submission attempts and student-visible feedback across years and curricula, with resume links and read-only submitted snapshots. The assignment editor now supports live drafts, publication, immutable revisions and starter files; Curriculum supports cover image uploads. Students now supports CSV roster import with field mapping, explicit new identities, existing-code matching, atomic preview/commit and per-student change history, plus group and individual printable login tickets. Assistance still shows sample data behind a “Preview” banner. Teacher assistance is not built yet.

## Documentation

Start at the [documentation index](docs/README.md). Specifications are split by student experience, admin dashboard, assignments, Python/assistance, data/access, UI, deployment, roadmap, and decisions/verification.

## Development

First-time setup (Convex login, auth keys, admin account, sample data) is in [deployment](docs/deployment.md#first-time-setup). Day to day, run these in separate terminals:

```bash
npx convex dev
```

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). `convex dev` watches and syncs backend code to the selected dev deployment; it is not read-only. Do not commit environment files or credentials.

## Checks and contributor guidance

`npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all pass as of October 15, 2026; details are in [decisions and verification](docs/decisions-and-verification.md).

Read [AGENTS.md](AGENTS.md). Before Next.js changes, read the relevant installed guide in `node_modules/next/dist/docs/`. Before Convex changes, read `convex/_generated/ai/guidelines.md` and applicable skills.

No domain or frontend hosting is provisioned. Managed hosting and browser Python are the agreed direction; see [deployment](docs/deployment.md).
