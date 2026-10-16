# Code CS

A provider-hosted Python learning workspace replacing Colab for two persistent groups: basic and advanced. Students use persistent name codes; admins manage lessons, assignments, review, and remote assistance.

## Status

Phases 1, 3 and 4 of the [roadmap](docs/roadmap.md) are built: the design system from the approved **CodeCS Basic v2** design, every student and admin route, the Convex schema, sign-in (student login codes and admin passwords via Convex Auth), and the student workspace with a CodeMirror editor, autosave, version history and Python that runs in the browser (Pyodide: Run, Stop, `input()`, packages). The learning home, lesson day, admin roster/attendance and curriculum scheduling read live Convex data. My work, the assignment editor, assistance and review still show sample data behind a “Preview” banner. Guided checks, turn-in, review and teacher assistance are not built yet.

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
