# Feedstock Dashboard

Records the movement of feedstock in and out of a single processing facility —
what came in, from which producer, what left, and to which sequestration site.
Weights are entered by hand, in kilograms, on a phone at the scale. Review and
totals happen on desktop.

`specs/mission.md` is the authority on what this is for and what it deliberately
does not do. `specs/tech-stack.md` holds the binding technical decisions, and
`specs/roadmap.md` the order things get built in.

## Running it locally

Node is pinned by `.nvmrc`. `engines` pins the major to `24.x` and `.npmrc` sets
`engine-strict`, so an install on another major fails by name rather than dying
later inside a dependency.

```bash
nvm use
npm ci
vercel env pull .env.local   # Clerk keys, from the Vercel project
npm run dev
```

Without `.env.local` the app will not start: Clerk needs a publishable key at
render time. `.env.local` is git-ignored and must stay that way.

| Command                        | What it does                         |
| ------------------------------ | ------------------------------------ |
| `npm run dev`                  | Development server on port 3000      |
| `npm run build`                | Production build                     |
| `npm run lint`                 | ESLint, zero warnings tolerated      |
| `npm run typecheck`            | `tsc --noEmit`                       |
| `npm test`                     | Vitest, once                         |
| `npm run test:watch`           | Vitest, watching                     |
| `npm run format`               | Prettier, writing                    |
| `npm run seed`                 | Loads the reference data, idempotent |
| `npm run provision -- <email>` | Creates a staff account — see below  |

Six checks are required on `main` and must be green to merge: `Lint`,
`Typecheck`, `Test`, `Commit convention`, and `Database` in GitHub Actions, plus
the `Vercel` preview deployment. `specs/tech-stack.md` § CI/CD is the authority
on what each one does.

## Accounts

There is no sign-up page, and there will not be one. `specs/mission.md`
§ Non-goals limits this to internal staff, so every account is created
deliberately, by someone who already has access to the Clerk instance.

To create one:

```bash
vercel env pull .env.local          # a current CLERK_SECRET_KEY
npm run provision -- arin@example.com
```

It prints the new user's id on stdout and a generated password on stderr, once.
Hand the password over on a private channel and have the person change it after
they sign in. Nothing stores it — if it is lost, delete the user in the Clerk
dashboard and provision again.

A malformed address exits without creating anything. That is deliberate: a
wrongly created user is a manual cleanup in the Clerk dashboard.

### Which Clerk instance

Clerk keeps development and production instances apart, each with its own keys
and its own list of users. Preview deployments can only use development keys —
Clerk does not permit production keys on a host's preview domain — so an account
provisioned against production cannot sign in to a preview, and vice versa.

A production instance additionally needs a domain with DNS records you control.
This project has not named one yet, which is tracked in
`specs/2026-08-13-auth/plan.md` § Open questions and belongs to Phase 8.

## Layout

```
src/app/(app)/     Everything behind authentication — renders inside the shell
src/app/sign-in/   Outside the group, so it renders without navigation
src/components/    Shell, sign-out control, the shared reference-data
                   components, and shadcn/ui components under ui/
src/lib/           Navigation, route rules, the name schema, Prisma queries,
                   weight and totals arithmetic, provisioning, helpers
src/proxy.ts       The gate: everything is protected except the public list
prisma/            Schema, checked-in migrations, and the seed script
scripts/           Operational commands, run by hand
specs/             Mission, tech stack, roadmap, and one folder per phase
```

Producers and sequestration sites are one surface built twice over: the form,
the list, the archive dialog and the toast in `src/components/reference-*.tsx`
are shared, and each entity brings its own queries, Server Actions and routes.

Routes are protected by exception: `src/lib/routes.ts` lists what is reachable
signed out, and everything else requires a session. A page added in a later
phase is therefore protected the moment it exists.

## Contributing

`specs/tech-stack.md` § Branching & pull request workflow is binding. In short:
never commit to `main`; a phase ships in two pull requests, its spec then its
implementation, both on a branch named for the phase number, and it is the
implementation the one-per-phase rule governs; anything implementing no
roadmap bullet goes on a `maint-` branch instead and does not count against a
phase; Conventional Commits for every commit message and every pull request
title — the title is what a squash merge writes onto `main`, and CI checks
it.
