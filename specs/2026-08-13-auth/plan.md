# Phase 1 — Auth — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The phase ships as three pull requests. Tasks 1–2 are the first, tasks 3–4 the second,
tasks 5–13 the third. The order is the roadmap's: the corrections to Phase 0 land before
any auth code is built on them, and the title gate is in place before the largest pull
request of the phase is opened.

## Pull request 1 — Phase 0 carry-overs

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 1  | `--primary` and `--sidebar-primary` set to `emerald-700` in light and `emerald-500` in dark, with `--primary-foreground` flipped to white and near-black to match | A unit test asserting those four tokens hold the exact `oklch` values the constitution names, in both the `:root` block and the `prefers-color-scheme: dark` block. The ratios stay in `specs/tech-stack.md` § Application, which already carries them |
| 2  | The active navigation destination carries a non-color cue, a heavier font weight than the inactive ones | RTL test asserting the link with `aria-current="page"` renders the heavier weight and the others do not, so the cue cannot be deleted while the accent is retuned |

## Pull request 2 — Commit convention gate

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 3  | A `Commit convention` job in `.github/workflows/ci.yml` that checks the pull request title against Conventional Commits 1.0.0, triggered on `pull_request` types `opened`, `edited`, `reopened`, and `synchronize`, and skipped on the `push` trigger where no title exists | Manual: open this pull request with a malformed title, confirm the job turns red and the merge button is disabled; edit the title to a valid one and confirm the job re-runs without a new commit and turns green |
| 4  | `Commit convention` added to `main`'s required status checks | Manual: `gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'` returns it alongside `Lint`, `Typecheck`, and `Test` |

## Pull request 3 — Clerk

| #  | Feature task | Paired test task |
|----|--------------|------------------|
| 5  | `@clerk/nextjs` installed and `<ClerkProvider>` wrapping the document in the root layout | Unit test asserting the root layout renders its children inside the provider, with `@clerk/nextjs` mocked |
| 6  | The app shell moved out of the root layout into an `(app)` route group layout, with `/`, `/record`, `/producers`, and `/sites` inside it | RTL tests carried over from Phase 0 still pass against the new layout, plus an assertion that a page rendered outside the group renders no navigation |
| 7  | `clerkMiddleware` in `src/middleware.ts` protecting every route except `/sign-in` and Next's static assets | Unit test over the route matcher: `/`, `/record`, `/producers`, `/sites` are protected; `/sign-in`, `/_next/static/*`, and `/favicon.ico` are not |
| 8  | A `/sign-in` catch-all route rendering Clerk's `<SignIn />`, outside the `(app)` group, with `appearance` mapped to the theme's CSS variables | RTL test asserting the route renders the Clerk component and passes the theme variables through `appearance`, with `@clerk/nextjs` mocked |
| 9  | A sign-out control in the app shell, reachable at a phone width and a desktop width, returning to `/sign-in` | RTL test asserting the control renders for a signed-in user and not for a signed-out one, with Clerk's control components mocked |
| 10 | Clerk publishable and secret keys configured in Vercel for each environment and in `.env.local`, with `.env.local` ignored by git | Manual: `vercel env ls` lists both keys in every environment, `git check-ignore .env.local` exits zero, and the app boots locally against the keys |
| 11 | A provisioning script that creates a user through the Clerk Backend API, taking an email address and reporting the created user id | Unit test with the Clerk client mocked: a valid email calls `createUser` once with that address; a missing or malformed argument exits non-zero without calling Clerk. Plus one live run creating and then deleting a throwaway user |
| 12 | `README.md` created — what the app is, how to run it locally, and a provisioning section covering how to run the script, who to run it for, and why invitations are not used | Manual: someone who has not read the script follows the README end to end to create and delete a throwaway user, and gets the app running locally from the same document |
| 13 | The initial staff accounts provisioned, including one for Arin | Manual: each account signs in on the pull request's Vercel preview and reaches the app shell |

## Decisions

**Clerk's prebuilt components, themed — the one exception to shadcn/ui for all
components.**

`specs/tech-stack.md` § Application says shadcn/ui is used wherever a UI need has a
shadcn component. Authentication does not: `<SignIn />` and Clerk's session controls are
not UI widgets but the client half of an authentication protocol, carrying password
reset, verification, bot protection, and session refresh. Rebuilding those forms on
`useSignIn` with shadcn inputs would re-implement flows Clerk maintains, and every one of
them is a place to get authentication subtly wrong.

The components are styled through Clerk's `appearance` prop, mapped to the CSS variables
already in `src/app/globals.css`, so the sign-in surface inherits Inter, the neutral
palette, and the emerald accent in both themes rather than looking like a different
product.

The alternatives were hand-built shadcn forms on Clerk's hooks, and Clerk's hosted
Account Portal. The first was rejected for the reason above. The second — redirecting to
Clerk-hosted pages — was rejected because it takes an operator at the scale off the app's
domain mid-flow onto a page that cannot be styled to the shell.

The cost accepted: the sign-in surface is not literally shadcn, so this file is the
record that the exception was deliberate and scoped to authentication.

**The app shell moves into an `(app)` route group.**

Phase 0 put `<AppShell>` in the root layout, which wraps every route including
`/sign-in`. A signed-out visitor would see a tab bar whose every destination redirects
back to sign-in. Layouts nest, so the only way to render a route without the shell is to
move the shell down a level. `(app)` is a route group, so no URL changes.

The cost accepted: page files move on disk, and the Phase 0 layout test moves with them.

**The provisioning path is documented in a new `README.md`.**

The repository has no README today. Provisioning is the first thing a new person needs
and the front page is where they look for it, so the document that explains it is the
project's README rather than a `docs/` file created for one page.

The cost accepted: task 12 is larger than "write the provisioning steps". A README that
covers only provisioning would be a strange front page, so the task also carries what
the app is and how to run it locally. Phase 5's runbook has somewhere obvious to go
afterwards.

The alternative was `docs/provisioning.md` — smaller, but it invents a directory
convention this project has not chosen and leaves the repository still without a front
page.

## Open questions

- **Which Clerk instance backs preview deployments.** Carried from
  `requirements.md` § Open questions. Task 10 cannot be finished without an answer, and
  task 13 depends on which instance the staff accounts are created in. Settle it before
  task 10 rather than at task 13, when accounts already exist in the wrong place.
- **Whether the sign-out control is Clerk's `<UserButton />` or a shadcn Button calling
  `signOut()`.** Both satisfy task 9 and the decision above; the second keeps the shell's
  own chrome consistent while leaving the protocol to Clerk. Decide when the shell is in
  front of you at a phone width, and record the answer here.
