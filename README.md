# Code CS

A provider-hosted Python learning workspace replacing Colab for two persistent groups: basic and advanced. Students use persistent name codes; admins manage lessons, assignments, review, and remote assistance.

## Status

Phase 1 of the [roadmap](docs/roadmap.md) is built: the design system from the approved **CodeCS Basic v2** design, every student and admin route, the full Convex schema, and sign-in (student login codes and admin passwords via Convex Auth). The learning home, lesson day, admin roster/attendance and curriculum scheduling read live Convex data. The workspace, My work, assignment editor, assistance and review screens show sample data behind a “Preview” banner until their phases land. The Python runtime, editor, autosave, checks and turn-in are not implemented yet.

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
