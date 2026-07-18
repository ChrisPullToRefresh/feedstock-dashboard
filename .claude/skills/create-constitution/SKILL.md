---
name: create-constitution
description: Bootstrap a project's constitution — specs/mission.md, specs/tech-stack.md, and specs/roadmap.md — seeded from VISION.md. Together these three files ARE the constitution; there is no separate CONSTITUTION.md file. Use only when called directly. Always confirms scope with AskUserQuestion before writing each file rather than inventing details VISION.md doesn't state.
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
before committing it to a durable doc. Three files, three AskUserQuestion calls minimum
(one question with up to 4 sub-questions per call is fine; skipping the call is not).

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
     user-answered rather than drafted. Before writing, ask via AskUserQuestion — one call,
     multiple sub-questions — covering: application framework/language, database, hosting
     platform, and auth approach (add others the project clearly needs, e.g. offline
     support if VISION.md mentions field use with poor connectivity).
   - Shape: `# Tech Stack` as a table or list of decisions, one row per concern, each with
     the choice and a short rationale (cite VISION.md where it drove the decision, e.g.
     "mobile-friendly requirement → responsive framework X").

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

6. **Report** what was written (three file paths under `specs/`) and a one-line summary of
   the biggest judgment calls made from the AskUserQuestion answers, so the user can spot
   anything to correct.

## Notes

- Keep every doc's content traceable to VISION.md or an explicit user answer — if you're
  about to write a sentence that's neither, that's the signal to ask instead.
- These docs are meant to be living — a re-run should read what's already there and treat
  it as a refresh (ask what changed) rather than regenerating from scratch and discarding
  prior answers.
