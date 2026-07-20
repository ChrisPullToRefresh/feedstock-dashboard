---
name: create-constitution
description: Bootstrap a project's constitution — specs/mission.md, specs/tech-stack.md, and specs/roadmap.md — seeded from VISION.md. Together these three files ARE the constitution; there is no separate CONSTITUTION.md file. Use only when called directly. Always confirms scope with AskUserQuestion before writing each file rather than inventing details VISION.md doesn't state. Testing tools and CI/CD are mandatory dimensions of tech-stack.md and roadmap.md, asked about even when VISION.md is silent on them.
user-invocable: true
---

# create-constitution

Turns a project's `VISION.md` into the project's constitution: three durable planning docs
under `specs/` — `mission.md`, `tech-stack.md`, `roadmap.md` (no separate `CONSTITUTION.md`
— these three files together are it). VISION.md is usually short and informal — expand it
into structured docs without inventing facts it doesn't support. Anything it doesn't
determine (tech choices, phase granularity, scope calls) gets asked, not guessed.

**Hard rules:**
- Never `Write` any of the three target files without first calling AskUserQuestion for
  that specific file and folding the answer in — even if VISION.md seems to already answer
  everything. Three files, three AskUserQuestion calls minimum (a floor, not a ceiling): a
  call caps at 4 questions, and `tech-stack.md` routinely needs more (framework, database,
  hosting, auth, testing, CI/CD, ...) — split across a second call for that file rather than
  dropping questions.
- Testing tools and CI/CD are never optional, even though VISION.md will almost never
  mention them. `tech-stack.md`'s AskUserQuestion call must always cover testing
  framework(s) and CI/CD platform (step 4), and `roadmap.md`'s earliest phase must always
  include standing up that pipeline (step 5). Silence in VISION.md is the reason to ask,
  not a reason to skip.

## Workflow

1. **Locate VISION.md** — project root, then `docs/VISION.md`. If missing, tell the user and
   ask for its path or offer to draft one together — don't fabricate a vision from nothing.

2. **`specs/`** — `mkdir -p specs`. If it already has content, treat this as a refresh: read
   existing files first and ask whether to overwrite or merge rather than clobbering silently.

3. **specs/mission.md**
   - Draft pitch, problem, users, differentiators, and key features from VISION.md.
   - Ask (AskUserQuestion) whatever VISION.md leaves implicit — typically the primary
     user/persona (VISION.md often says *what* the product does but not *who* uses it daily)
     and the differentiator vs. doing this manually or with an existing alternative. Ground
     options in VISION.md specifics, not generic personas.
   - Shape: `# Product Mission` → `## Pitch` → `## Problem` → `## Users` (`### Primary
     Customers`, `### User Personas`) → `## Differentiators` → `## Key Features`.

4. **specs/tech-stack.md**
   - Usually mostly user-answered rather than drafted, since VISION.md rarely specifies
     technology. Ask (one or more AskUserQuestion calls) covering: framework/language,
     database, hosting, auth (plus anything else the project clearly needs, e.g. offline
     support for field use), **unit/component testing**, **end-to-end testing** (if the
     product has meaningful user-facing flows), and **CI/CD platform** (default to GitHub
     Actions unless hosting implies otherwise, e.g. GitLab CI for a GitLab remote). The
     testing/CI questions are mandatory, not optional add-ons.
   - Shape: `# Tech Stack` as a table/list of decisions, each with a short rationale (cite
     VISION.md where it drove the choice, e.g. "mobile-friendly requirement → responsive
     framework X"), including rows for the testing frameworks and CI/CD platform. Add a
     `## Testing & CI/CD Practices` section: required PR checks (lint + typecheck,
     unit/component tests, E2E if chosen, production build), the merge gate (confirm the
     exact gate in the same AskUserQuestion call rather than assuming), draft-PR convention,
     and workflow hygiene (dependency caching, per-PR concurrency cancellation, pinned action
     versions, no hard-coded secrets).

5. **specs/roadmap.md**
   - Break the work into small phases toward v1.0, each shippable/demoable on its own. Pull
     explicit v1.0 scope from VISION.md's main bullets; pull deferred items from anything it
     marks as later (notes, "post version 1.0", stakeholder asides).
   - Ask (AskUserQuestion) about phase granularity (e.g. 3-4 broad vs. 5-7 fine-grained) and
     confirm v1.0-vs-later placement for anything VISION.md leaves ambiguous — don't silently
     decide a borderline feature's placement.
   - Shape: `# Roadmap` → `## Phase 1: <name>` (goal, feature checklist, success criteria) →
     `## Phase 2: ...` → ... → final phase ends at v1.0 → `## Later (Not Yet Scheduled)` —
     an unordered, unprioritized parking-lot list of post-1.0 features, not another phase.
   - The earliest phase must include checklist items for standing up the testing frameworks
     and CI/CD pipeline from `tech-stack.md` (e.g. "GitHub Actions CI — lint + typecheck,
     unit tests, [E2E tests,] build — required on every PR"), and its success criteria must
     state PRs must pass CI before merge. Later phases don't repeat testing/CI bullets —
     `tech-stack.md`'s practices apply to every phase by default — but don't drop Phase 1's
     setup items to keep the checklist short.

6. **Report** the three file paths written and a one-line summary of the biggest judgment
   calls made from the AskUserQuestion answers, so the user can spot anything to correct.

## Notes

- Keep every sentence traceable to VISION.md or an explicit user answer — if it's neither,
  that's the signal to ask instead.
- These docs are living: a re-run is a refresh (read what's there, ask what changed), not a
  regeneration that discards prior answers.
- On refresh, preserve and update any existing testing/CI content in `tech-stack.md` or
  `roadmap.md` rather than dropping it — "VISION.md doesn't mention it" is never license to
  remove testing/CI content that's already there.
