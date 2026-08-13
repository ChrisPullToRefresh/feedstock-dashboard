# Phase 1 — Auth — Validation

## Automated

### Unit and component (Vitest + React Testing Library)

Matching the paired test tasks in `plan.md`:

1. **The accent tokens are what the constitution names.** Asserts `--primary`,
   `--sidebar-primary`, and `--primary-foreground` hold the exact `oklch` values for
   `emerald-700` / `emerald-500` and their foregrounds, in both the `:root` block and the
   `prefers-color-scheme: dark` block. It fails loudly if a later phase retunes the
   accent. The ratios themselves stay in `specs/tech-stack.md` § Application, which
   already carries them measured; this test does not recompute them.
2. **The active destination has a non-color cue.** Asserts the link carrying
   `aria-current="page"` renders the heavier font weight and the others do not.
3. **The root layout provides Clerk.** Asserts children render inside `<ClerkProvider>`,
   with `@clerk/nextjs` mocked.
4. **The shell renders only inside the `(app)` group.** The Phase 0 shell tests move with
   the layout and still pass; one further test asserts a page outside the group renders
   no navigation.
5. **The middleware matcher protects what it should.** `/`, `/record`, `/producers`, and
   `/sites` are protected; `/sign-in`, `/_next/static/*`, and `/favicon.ico` are not.
6. **The sign-in route is themed.** Asserts `<SignIn />` renders and receives the theme's
   CSS variables through `appearance`, with `@clerk/nextjs` mocked.
7. **The sign-out control follows session state, and there is exactly one of it.**
   Asserts a single control named "Sign out" for a signed-in user, none for a signed-out
   one, and that activating it calls `signOut`, with Clerk's hooks mocked. The count
   matters: two copies for two viewports is the pattern Phase 0 avoided so that each
   control has one accessible name.
8. **The provisioning script validates its input.** With the Clerk client mocked, a valid
   email calls `createUser` once with that address; a missing or malformed argument exits
   non-zero without calling Clerk.

No coverage threshold. `specs/tech-stack.md` § Testing sets none.

Nothing here proves a real session. Clerk is mocked in every test above, by necessity —
the middleware redirect and the sign-in flow are proven by hand below.

## Manual

Run these against the pull request's Vercel preview deployment, not `localhost`. Per
`specs/tech-stack.md` § Hosting & deployment the Vercel account and the
browser-automation Chrome profile are different accounts, so every step is done by a
person or via the Vercel CLI — never by browser automation.

**The accent and the active tab** (pull request 1)

1. Open the preview on a desktop browser with the operating system set to light
   appearance. **Expect:** the accent reads as a deeper green than before, and body text
   on any accent-filled control is white.
2. Switch the operating system to dark appearance and reload. **Expect:** the whole shell
   flips to the dark palette, the accent is a brighter green, and text on an accent fill
   is near-black. There is no in-app toggle; the operating system is the only control.
3. In both appearances, look at which navigation destination is current. **Expect:** it is
   identifiable without relying on its color — the label is visibly heavier.
4. Take a screenshot and view it in grayscale, or use the browser's grayscale filter.
   **Expect:** the current destination is still identifiable. This is the check the
   1.4.1 finding asks for.

**The title gate** (pull request 2)

5. Open pull request 2 with the title `add the title check`. **Expect:** the
   `Commit convention` job turns red and the merge button is disabled.
6. Edit the title to `ci: check pull request titles against conventional commits`,
   pushing no new commit. **Expect:** the job re-runs on the edit alone and turns green.
7. Run `gh api repos/{owner}/{repo}/branches/main/protection --jq
   '.required_status_checks.contexts'`. **Expect:** four contexts — `Lint`, `Typecheck`,
   `Test`, and `Commit convention`.

**Auth** (pull request 3)

8. Open the preview URL in a private window, signed out, at a phone width.
   **Expect:** a redirect to `/sign-in`, with no bottom tab bar on the page.
9. Request `/producers` directly in the same private window. **Expect:** the same
   redirect to `/sign-in`, not a producers page and not a raw error.
10. Look at the sign-in page in both operating system appearances. **Expect:** Inter,
    the neutral palette, and the emerald accent — it looks like the same product as the
    shell, not a Clerk default.
11. Sign in with a provisioned account, one-handed on a phone. **Expect:** the app shell,
    with the bottom tab bar back.
12. Find and use the sign-out control at a phone width, then again at a desktop width.
    **Expect:** a slim header above the page content carries it, right-aligned, in both;
    it does not appear on `/sign-in`; the bottom tab bar still holds four destinations and
    no account item; and signing out returns to `/sign-in`.
13. Press the browser's back button after signing out. **Expect:** `/sign-in` again, not a
    cached view of the shell.
14. Run the provisioning script for a throwaway address. **Expect:** it prints the created
    user id, the user appears in the Clerk dashboard, and that account can sign in on the
    preview. Delete the throwaway user afterwards.
15. Hand `README.md` to someone who has not read the script and have them get the app
    running locally, then create and delete a throwaway user, from the document alone.
    **Expect:** they succeed without asking a question the README should have answered.
16. Sign in as each provisioned staff account, including Arin's. **Expect:** each reaches
    the app shell.
17. Open the browser console on the preview. **Expect:** no errors and no hydration
    warnings.

Steps 8, 9, and 11 are what prove the roadmap's **Done when** line.

## CI gate

The jobs in `.github/workflows/ci.yml` today, all of them required in `main`'s branch
protection:

1. **Lint** — ESLint
2. **Typecheck** — `tsc --noEmit`
3. **Test** — Vitest

Pull request 2 adds a fourth, **Commit convention**, and makes it required. It gates
pull request 3 but not the two before it, since it does not exist yet — pull request 2
is the one that installs it, and it proves itself on itself through manual steps 5 and 6.

`main`'s protection requires branches to be up to date before merging, so each of the
three pull requests must be updated onto `main` after the one before it merges.

The Vercel preview deployment must also succeed. It runs alongside the Actions run and is
not one of its jobs.

Playwright is the remaining check `specs/tech-stack.md` § CI/CD names, and
`specs/roadmap.md` places it in Phase 5. No end-to-end coverage is claimed here.

## Open questions

None beyond the two parked in `plan.md` § Open questions. The Clerk instance question
changes which account signs in at manual steps 11 and 16, but not how any of these steps
are run.
