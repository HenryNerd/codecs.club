# Development Setup and Deployment

[Documentation index](README.md). Updated **October 15, 2026**. The October 14 inspection used local files and read-only Convex MCP calls; the October 15 work added the application backend source and ran local checks (see [verification](decisions-and-verification.md)).

## Verified setup

| Item | Evidence/status |
| --- | --- |
| Website | Phase 1 structure: login, student and admin routes, design system. See the [route map](ui-design.md#route-map) |
| Installed packages | Next.js 16.4.0, React 19.3.0, Convex 1.46.0, @convex-dev/auth 0.0.96, @convex-dev/rate-limiter 0.4.2 |
| Convex project | Team `code-cs`, project `app` |
| Development | [tidy-firefly-410](https://dashboard.convex.dev/d/tidy-firefly-410), the personal dev deployment of team member **Prithvi Konduru** (`dev/prithvi-konduru`). Chosen as the shared development target |
| Application backend | Schema, auth and functions exist in `convex/`. On October 15 they were codegen-checked against the deployment but **not yet pushed**; pushing is a developer step (below) |
| Production | [moonlit-alpaca-771](https://dashboard.convex.dev/d/moonlit-alpaca-771); not touched |
| Domain/frontend hosting | Not provisioned |

Developer CLI login does not implement student/admin login. Listing production does not prove the app is released.

## First-time setup

From the repository root:

```bash
npm install
```

`.env.local` (ignored by git) selects the deployment:

```
CONVEX_DEPLOYMENT=dev:tidy-firefly-410 # team: code-cs, project: app
NEXT_PUBLIC_CONVEX_URL=https://tidy-firefly-410.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://tidy-firefly-410.convex.site
```

Log in with a Convex account that belongs to team `code-cs` (`npx convex login`), then, once per deployment:

1. Push the backend and keep it syncing (leave running):
   ```bash
   npx convex dev
   ```
2. Set the Convex Auth signing keys and site URL (keeps existing keys unless `--force`):
   ```bash
   node scripts/setup-auth-env.mjs
   ```
3. Create an admin account (choose your own username and a password of at least 10 characters; it is hashed by Convex Auth):
   ```bash
   npx convex run admins:createAdmin '{"username":"rivera","displayName":"Ms. Rivera","password":"…"}'
   ```
4. Load the sample school from the design (only on an empty deployment; refuses to run twice):
   ```bash
   npx convex run seed:run
   ```

The seed creates Python Fundamentals (basic, 8 days), Advanced Python, last year’s Intro to Python, the 2026–27 schedule, the 24-student basic roster plus 3 advanced students, sample work for `jsmith`, a Countdown review queue and two open help requests.

## Daily development

Run in separate terminals:

```bash
npx convex dev
```

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Students sign in with a login code (for example `jsmith` after seeding); admins use the footer form. `convex dev` watches and syncs backend code to the selected dev deployment; it is not read-only. Local code uses the cloud development database; local/dev/prod data never mirror automatically.

Verify deployment targets before operations. Do not commit credentials or environment files. Keep dev/prod environment values separate.

## Checks

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

`npm test` runs Convex functions in memory with `convex-test` (no deployment needed). `npx convex codegen --typecheck enable` regenerates `convex/_generated` and typechecks `convex/`.

## Managed release direction

- External website hosting and Convex Cloud; frontend provider and domain ownership/setup remain pending (D12).
- Prioritize browser Python; a Python server is only a fallback after device tests demonstrate a need.
- Verify hosting headers (including cross-origin isolation for Pyodide interrupts), worker/assets, package requests, slide links, auth origins (`SITE_URL`), and school-network access before release.
- Configure deployed frontend values for the intended backend, not a copied development URL.
- No separate custom backup system is approved.
- Validate **50 actively working students plus admins** and retained work for **1,000 lifetime students**. Storage/API estimates depend on file/version volumes, not student count alone.

## Baseline tooling notes

`eslint-config-next` is pinned to 16.4.0 to match Next.js. TypeScript is 6.0.3 because the installed lint parser rejects TypeScript 7. Node type definitions are 24.x to match the Node 24 runtime. Some bundled ESLint plugins declare older peer ranges, so npm prints peer warnings.

On Windows, a clean `npm ci` was previously blocked by a locked `esbuild.exe` (EPERM), and route type generation failed inside a restricted sandbox with `Access is denied (os error 5)`; both passed outside those conditions. `npm audit` reported five high-severity findings in the lint tooling’s `braces` chain with no patched release; recheck before release.

## Contributor guidance

Read [AGENTS.md](../AGENTS.md). Before Next.js work read the relevant guides in `node_modules/next/dist/docs/`; before Convex work read `convex/_generated/ai/guidelines.md` and applicable project skills. Identify deployments before writes and follow the project's deployment guard for production operations.

## Official references

[CLI setup](https://docs.convex.dev/cli/overview), [MCP access](https://docs.convex.dev/ai/convex-mcp-server), [local deployments](https://docs.convex.dev/cli/local-deployments), [frontend hosting](https://docs.convex.dev/production/hosting), [authentication](https://docs.convex.dev/auth/overview), [Convex Auth](https://labs.convex.dev/auth), [file storage](https://docs.convex.dev/file-storage/overview), [Convex runtimes](https://docs.convex.dev/functions/runtimes).
