---
name: critique
description: Audit the project against industry best practice — accessibility, security, framework idiom, testing, supply chain, CI, and type safety — and report where it deviates, with the authority for each claim and the concrete consequence. Takes an optional area to focus on. Use only when called directly.
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Edit, Write
---

# Critique

Find where this project departs from what the wider industry has converged on, and say
what that departure will cost.

This is not `/code-review`. That skill reads a diff for defects. This one reads the whole
project for the things that are individually legal, individually shippable, and
collectively the reason a codebase becomes unpleasant to work in — the missing
`permissions:` block, the color that fails contrast, the client component that did not
need to be one, the dependency nobody has looked at.

An optional argument narrows it: `/critique accessibility`, `/critique src/components`,
`/critique ci`. With no argument, audit the whole project.

## Core rules

**Every finding names its authority.** "Best practice" without a source is opinion
wearing a lab coat. Each finding cites exactly one, and the ladder is ordered — a rung
beats every rung below it:

1. **This project's constitution.** `specs/mission.md`, `specs/tech-stack.md`,
   `specs/roadmap.md`, and the active spec folder. A deviation from these is the
   strongest finding available, and generic industry advice never outranks them.
2. **A measurable standard.** WCAG, OWASP, RFCs, Conventional Commits, SemVer. These
   come with numbers or grammars, which means you can compute the answer instead of
   asserting it.
3. **The framework's own documentation.** Next.js, React, Vercel, Tailwind, Prisma.
   Their stated guidance about their own tool.
4. **The ecosystem's demonstrable default.** What the tool's own scaffolding generates,
   what its lint config enables by default. Verifiable, not remembered.

Nothing below rung four is a finding. If the only argument is "people usually do it the
other way", drop it.

**Measure rather than assert.** A contrast claim needs the computed ratio. A bundle claim
needs the number. A dependency claim needs `npm audit` output. If a claim is checkable and
you did not check it, you have an opinion, not a finding.

**A deliberate choice is not a deviation.** Read `plan.md` § Decisions and the comments
around the code before flagging anything. This project rejects things on purpose and
writes down why. Re-litigating a recorded decision is the fastest way to make this skill
worthless.

**Absence scheduled for later is not absence.** `specs/roadmap.md` says when each thing
arrives. A phase that has not run yet is not a gap — no E2E tests before the phase that
installs Playwright, no auth before the phase that adds Clerk.

**Taste is not practice.** File naming, folder shape, import order, arrow-versus-function.
If reasonable engineers ship both and nothing observable differs, it does not belong here.

## Where to look

Categories are places to look, not a checklist to crawl. Each names what makes a finding
real there — anything weaker is noise.

- **Accessibility.** Computed contrast ratios against the theme's own tokens; accessible
  names on interactive elements; focus order and visible focus; keyboard reachability;
  touch target size. Real when you can state the ratio, or the element with no name.
- **Security.** Workflow token scopes; secrets in the repository or in client bundles;
  dependency advisories; authentication boundaries; anything user-supplied reaching a
  query, a shell, or `dangerouslySetInnerHTML`. Real when you can name the reachable path.
- **Framework idiom.** Server versus client boundaries and what forces a component
  across; data fetching and caching; metadata; images and fonts; error and loading
  boundaries. Real when the framework's docs state the guidance and the code does
  otherwise.
- **Testing.** What breaks silently because nothing asserts it. Never coverage
  percentage — `specs/tech-stack.md` sets no threshold and CI will not fail on one. Real
  when you can name the regression that would ship green.
- **Supply chain.** Unpinned or floating actions; `engines` unenforced; lockfile drift;
  advisories; dependencies with no consumer. Real when you can show the command that
  fails or the version that can move under you.
- **CI and delivery.** What merges without being checked. Compare the jobs that run
  against the checks branch protection actually requires. Real when you can name the
  breakage that reaches `main` green.
- **Type safety.** `any`, non-null assertions, unchecked casts, `@ts-expect-error` with
  no explanation, types that model impossible states. Real when you can construct the
  value that slips through.
- **Performance.** Only with a number: bundle size, an image without dimensions, a font
  without a display strategy, a render that cannot be memoized because of an unstable
  prop.

## Procedure

### 1. Read the constitution before reading any code

Read `specs/mission.md`, `specs/tech-stack.md`, `specs/roadmap.md`, and the active spec
folder's `plan.md` § Decisions. You are auditing against the project's standards first and
the industry's second, and you cannot tell a deviation from a decision without them.

Note every explicit rule — the accent color, the styling policy, the component library,
the responsive direction, the test stack. Those become rung-one checks.

### 2. Establish the shape of the project

```bash
ls -R src 2>/dev/null | head -50
cat package.json
ls .github/workflows/ 2>/dev/null
```

Read the config files that decide behavior: `tsconfig.json`, the ESLint config, the
Tailwind or theme entrypoint, `next.config.*`, `vitest.config.*`. Read the actual source
of anything you intend to make a claim about.

### 3. Measure

Run the checks rather than reasoning about them. What is worth running depends on the
project, but the shape is:

```bash
npm run lint; npm run typecheck; npm run test
npm audit --omit=dev
npm run build
gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts' 2>/dev/null
grep -rn "any\|@ts-expect-error\|dangerouslySetInnerHTML" src/
```

For anything with a formula — contrast, bundle size, ratios — compute it. Write a throwaway
script in the scratchpad if that is what it takes. A computed number settles an argument
that a paragraph of prose does not.

### 4. Judge each candidate

For every candidate finding, in order. Drop it the moment one fails:

1. Which rung of the ladder authorizes this? If none, drop it.
2. Did the project decide this deliberately? If `plan.md` § Decisions or a comment says
   so, drop it.
3. Is it scheduled in `specs/roadmap.md` for a later phase? If so, drop it.
4. Can you state the consequence in *this* codebase — the input, the state, the thing
   that breaks or the person who cannot use it? If not, drop it.
5. Can you name the smallest change that fixes it? If not, you do not understand it yet.

### 5. Rank

By consequence, not by category:

1. **Reaches users** — anyone locked out, any data exposed, anything that breaks in
   production.
2. **Reaches `main`** — something that merges green and should not.
3. **Reaches the next engineer** — a trap that will be stepped in, a pattern that
   compounds as later phases copy it.

Say how many survived. Report the count honestly, including zero.

### 6. Report

For each finding, in rank order:

- **What** — one sentence, the deviation itself.
- **Where** — `path:line`, quoted.
- **Authority** — the rung, named specifically. Not "best practice" but "WCAG 2.1 AA
  1.4.3 requires 4.5:1 for normal text" or "`specs/tech-stack.md` § Application".
- **Consequence** — what happens, concretely, in this project.
- **Smallest fix** — the minimal change, not a refactor you find more elegant.

Then, separately and briefly: what the project does well and should keep doing. A
critique that only subtracts gets discounted, and a deliberate strength is worth naming so
later phases preserve it.

### 7. Offer to act

Findings authorized by rung one against the constitution are usually the user's decision,
not yours — changing them may mean amending `specs/tech-stack.md`, which is theirs.
Findings on rungs two to four are usually just fixes.

Use `AskUserQuestion` to ask which to act on, batching up to four, highest-ranked first.
Then apply only what was chosen, on a branch, through a pull request, following
`specs/tech-stack.md` § Branching & pull request workflow. Never push to `main`, never
merge.

If a finding needs a constitution amendment, say so and let the user decide — do not edit
the constitution as a side effect of a code fix.

## Writing style

- Lead with the consequence. The reader decides what to fix from that line alone.
- Quote the code and the standard. Never paraphrase either into something vaguer.
- One sentence per finding before the detail. If it takes a paragraph to say what is
  wrong, you have not found it yet.
- No severity theatre. "Critical" and "urgent" mean nothing next to a stated consequence.
- Say when you are uncertain, and say what would settle it.
