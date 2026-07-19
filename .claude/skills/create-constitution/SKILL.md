---
name: create-constitution
description: Bootstrap a project's constitution — specs/mission.md, specs/tech-stack.md, and specs/roadmap.md — seeded from VISION.md. Together these three files ARE the constitution; there is no separate CONSTITUTION.md file. Use only when called directly. Always confirms scope with AskUserQuestion before writing each file rather than inventing details VISION.md doesn't state. Testing tools and CI/CD are mandatory dimensions of tech-stack.md and roadmap.md, asked about even when VISION.md is silent on them.
user-invocable: true
---

# create-constitution

Turns a project's `VISION.md` into the project's constitution: three durable planning docs
under `specs/` — `mission.md`, `tech-stack.md`, `roadmap.md`. There is no separate
`CONSTITUTION.md`; these three files together constitute it. VISION.md is usually short
and informal (a pitch plus a few notes) — this skill's job is to expand it into structured
docs without inventing facts VISION.md doesn't support. Anything not determinable from
VISION.md (tech choices, phase granularity, scope calls) gets asked, not guessed.

**Hard rule: never call Write on any of the three target files without first calling
AskUserQuestion for that specific file and folding the answer into the draft.** This
applies even if VISION.md seems to already answer everything — confirm scope/emphasis
before committing it to a durable doc. Three files, three AskUserQuestion calls minimum —
that's a floor, not a ceiling. AskUserQuestion caps a single call at 4 questions, and
`tech-stack.md` now routinely needs more than 4 decisions confirmed (framework, database,
hosting, auth, testing, CI/CD, plus anything else VISION.md implies) — when it does, make a
second AskUserQuestion call for that same file rather than dropping questions to fit one
call. Skipping a needed question is not allowed; splitting across calls is.

**Hard rule: testing tools and CI/CD are never optional.** VISION.md will almost never
mention them, but `tech-stack.md`'s AskUserQuestion call must always cover testing
framework(s) and CI/CD platform (see step 4), and `roadmap.md`'s earliest phase must always
include standing up that pipeline (see step 5). Silence in VISION.md is not a reason to
skip these — it's the reason to ask.

## Workflow

1. **Locate and read VISION.md.** Check the project root first, then `docs/VISION.md`. If
   it isn't found, tell the user and ask for its path or offer to draft one together before
   continuing — don't fabricate a vision from nothing.

2. **`specs/` directory** — create it (`mkdir -p specs`) before generating the three files
   below. If it already exists, treat this as a refresh: read existing files first and
   ask whether to overwrite or merge rather than clobbering silently.

3. **specs/mission.md**
   - Draft the pitch, problem, users, differentiators, and key features from VISION.md.
   - Before writing, ask via AskUserQuestion about whatever VISION.md leaves implicit —
     typically the primary user/persona (VISION.md often describes *what* the product does
     but not crisply *who* the day-to-day user is) and the differentiator versus doing this
     manually or with an existing alternative. Ground the options in specifics from
     VISION.md rather than generic personas.
   - Shape: `# Product Mission` → `## Pitch` → `## Problem` → `## Users` (`### Primary
     Customers`, `### User Personas`) → `## Differentiators` → `## Key Features`.

4. **specs/tech-stack.md**
   - VISION.md rarely specifies technology, so this file is usually mostly
     user-answered rather than drafted. Before writing, ask via AskUserQuestion — one or more
     calls (see the hard rule above on splitting past 4 questions) — covering: application
     framework/language, database, hosting platform, auth approach (add others the project
     clearly needs, e.g. offline
     support if VISION.md mentions field use with poor connectivity), **unit/component
     testing framework**, **end-to-end testing framework (if the product has meaningful
     user-facing flows)**, and **CI/CD platform** (default to asking about GitHub Actions
     unless the project's hosting choice implies otherwise, e.g. GitLab CI for a GitLab
     remote). These last three are mandatory questions, not optional add-ons — ask them even
     when VISION.md never mentions testing or CI.
   - Shape: `# Tech Stack` as a table or list of decisions, one row per concern, each with
     the choice and a short rationale (cite VISION.md where it drove the decision, e.g.
     "mobile-friendly requirement → responsive framework X"). Always include rows for the
     testing frameworks and CI/CD platform. Always add a `## Testing & CI/CD Practices`
     section covering: which checks the CI pipeline must run on every PR (typically lint +
     typecheck, unit/component tests, E2E tests if chosen, production build), the merge gate
     (e.g. all checks green plus review approval — confirm the exact gate via the same
     AskUserQuestion call rather than assuming), the draft-PR convention, and workflow
     hygiene (dependency caching, per-PR concurrency cancellation, pinned action versions,
     secrets never hard-coded).

5. **specs/roadmap.md**
   - Break the work into small phases leading up to version 1.0 — each phase should be
     shippable/demoable on its own, not a giant leap. Pull the explicit v1.0 scope from
     VISION.md's main bullets; pull deferred/post-1.0 items from anything VISION.md marks
     as later (notes, "post version 1.0", stakeholder asides).
   - Before writing, ask via AskUserQuestion about phase granularity (e.g. 3-4 broad
     phases vs. 5-7 fine-grained ones) and confirm which features belong in v1.0 vs. later
     when VISION.md is ambiguous about scope — don't silently decide a borderline feature's
     placement.
   - Shape: `# Roadmap` → `## Phase 1: <name>` (goal, feature checklist, success criteria)
     → `## Phase 2: ...` → ... → final phase ends at version 1.0 → `## Later (Not Yet
     Scheduled)` listing post-1.0 features as an unordered, unprioritized list (this
     section is a parking lot, not another phase — don't assign it dates or ordering).
   - The earliest phase (usually Phase 1, the foundation phase) must include checklist items
     for standing up the testing frameworks and CI/CD pipeline decided in `tech-stack.md`
     (e.g. "GitHub Actions CI pipeline — lint + typecheck, unit tests, [E2E tests,] build —
     required on every PR"), and that phase's success criteria must state that PRs run and
     must pass the CI pipeline before merge. Later phases don't need their own testing/CI
     bullets in roadmap.md — `tech-stack.md`'s testing practices apply to every phase's
     features by default — but don't drop the Phase 1 setup items to keep the checklist
     short.

6. **Report** what was written (three file paths under `specs/`) and a one-line summary of
   the biggest judgment calls made from the AskUserQuestion answers, so the user can spot
   anything to correct.

## Notes

- Keep every doc's content traceable to VISION.md or an explicit user answer — if you're
  about to write a sentence that's neither, that's the signal to ask instead.
- These docs are meant to be living — a re-run should read what's already there and treat
  it as a refresh (ask what changed) rather than regenerating from scratch and discarding
  prior answers.
- On a refresh, if `tech-stack.md` or `roadmap.md` already has testing/CI content (from a
  prior run or manual edit), preserve and update it rather than dropping it — don't treat
  "VISION.md doesn't mention it" as license to remove testing/CI content that's already
  there.
