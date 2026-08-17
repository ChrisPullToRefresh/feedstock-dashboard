# Phase 1 — Auth — Plan

Tasks run in order. Every feature task ships with its paired test task in the same
pull request.

The phase ships as one pull request, on the user's direction during implementation. It was
planned as three — tasks 1–2, then 3–4, then 5–13 — and the headings below still carry
that grouping, because it is the order the work is done in and the roadmap's reason for it
holds: the corrections to Phase 0 land before any auth code is built on them.
`specs/tech-stack.md` § Branching & pull request workflow allows this — one phase in one
pull request is a coherent slice — and § Decisions records what the single pull request
costs.

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
| 9  | A slim header above `main` inside the `(app)` layout, carrying a right-aligned shadcn Button that calls Clerk's `signOut()` and returns to `/sign-in`. One rendering, not a mobile copy and a desktop copy | RTL test asserting exactly one control with the accessible name "Sign out" renders for a signed-in user, none for a signed-out one, and that clicking it calls `signOut`, with Clerk's hooks mocked |
| 10 | Clerk publishable and secret keys configured in Vercel for each environment and in `.env.local`, with `.env.local` ignored by git | Manual: `vercel env ls` lists both keys in every environment, `git check-ignore .env.local` exits zero, and the app boots locally against the keys |
| 11 | A provisioning script that creates a user through the Clerk Backend API, taking an email address and reporting the created user id | Unit test with the Clerk client mocked: a valid email calls `createUser` once with that address; a missing or malformed argument exits non-zero without calling Clerk. Plus one live run creating and then deleting a throwaway user |
| 12 | `README.md` created — what the app is, how to run it locally, and a provisioning section covering how to run the script and who to run it for | Manual: someone who has not read the script follows the README end to end to create and delete a throwaway user, and gets the app running locally from the same document |
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

**Sign-out is a shadcn Button in a slim header, not Clerk's `<UserButton />`.**

The user delegated this one — "use your best judgement on adding a slim top bar" — so it
is recorded here as a judgement made on their instruction rather than an answer they
gave.

The Clerk exception above is justified by authentication being a protocol rather than a
widget. Sign-out is not a protocol; it is one function call with no failure modes worth
outsourcing. Stretching the exception to cover it would make the exception vaguer than
it needs to be, so the control is a shadcn Button calling `signOut()` and the shell stays
entirely shadcn and Tailwind, as `specs/tech-stack.md` § Application asks.

It goes in a slim header above `main`, right-aligned, rendered once at every width.
Placement was the harder half: the shell has no top chrome today, and the bottom tab bar
holds destinations at `flex-1`. `specs/2026-08-12-foundation/plan.md` § Decisions
rejected the top corner because it is the weakest one-handed reach zone — but it rejected
it for *primary navigation*. A rare, deliberate action is what a weak reach zone is for,
so a top-right control uses that reasoning rather than contradicting it.

The alternatives and why not:

- **A fifth tab in the bottom bar.** Puts a non-destination in the thumb zone and shrinks
  each tab from roughly 93px to 75px at a 375px viewport.
- **A header on mobile and a sidebar footer on desktop.** Two copies of one control, which
  is what Phase 0 deliberately avoided for the nav so that each thing has exactly one
  accessible name.
- **Clerk's `<UserButton />`.** It earns its place only if account management belongs
  inside the app. `specs/mission.md` does not ask for it, roles are not modeled, and it
  adds a second Clerk surface to theme whose popover would anchor awkwardly above a fixed
  bottom bar on a phone.
- **A dropdown showing the signed-in email.** Useful when records are attributed to the
  person who entered them. v0.1 does not attribute movements to users, so identity display
  has no job yet.

The cost accepted: Phase 1 adds top chrome to a shell Phase 0 shipped without any, and
`main` gains a header above it that every later phase's pages sit beneath.

**The provisioning path is documented in a new `README.md`.**

The repository has no README today. Provisioning is the first thing a new person needs
and the front page is where they look for it, so the document that explains it is the
project's README rather than a `docs/` file created for one page.

The cost accepted: task 12 is larger than "write the provisioning steps". A README that
covers only provisioning would be a strange front page, so the task also carries what
the app is and how to run it locally. Phase 8's runbook has somewhere obvious to go
afterwards.

The alternative was `docs/provisioning.md` — smaller, but it invents a directory
convention this project has not chosen and leaves the repository still without a front
page.

## Open questions

- **How this project connects to Clerk.** Deliberately left to the session that
  implements tasks 5–13, on the user's instruction. Three facts are settled and should be
  read before that session starts, so they are not rediscovered at task 10:

  1. **Preview deployments must use development keys.** Clerk states that production API
     keys cannot be used with a host's provided preview domain, so `*.vercel.app` previews
     take `pk_test_` / `sk_test_`. The escape — serving previews from a domain you own via
     Vercel's Preview Deployment Suffix — needs a Vercel Pro or Enterprise plan.
     <https://clerk.com/docs/deployments/set-up-preview-environment>
  2. **A Clerk production instance requires a domain you own, with DNS records you can
     edit.** It cannot be stood up on a `*.vercel.app` hostname. No domain is named in
     `specs/mission.md`, `specs/tech-stack.md`, or `specs/roadmap.md`, so v0.1 has no path
     to a production instance until one exists. That is a constitution-level gap, not a
     Phase 1 one — it also governs Phase 8's production promotion.
     <https://clerk.com/docs/guides/development/deployment/production>
  3. **The Vercel Marketplace integration maps instances to environments automatically**
     — development instance to Vercel's development and preview environments, production
     instance to production — and syncs both keys into the project, which is how
     `specs/tech-stack.md` § Data already provisions Neon. The catch: an existing Clerk
     application cannot be connected to it, so taking this route means a new
     application.
     <https://clerk.com/docs/guides/development/integrations/platforms/vercel-marketplace>

  **Settled during implementation.** The Vercel Marketplace integration was installed, so
  the development instance backs Vercel's development and preview environments and a
  production instance would back production. Task 13 provisions development-instance
  accounts now, which is what makes validation steps 11 and 16 runnable; `specs/roadmap.md`
  Phase 8 carries re-provisioning against production. Those accounts are therefore
  throwaway, and Arin gets a second one in Phase 8.

  Still open, and not this phase's to close: **no production domain is named**, so there is
  no path to a Clerk production instance. `specs/roadmap.md` Phase 8 carries it, because
  that is where production promotion depends on it.
