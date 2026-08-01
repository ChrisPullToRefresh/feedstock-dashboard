---
name: plan-new-version
description: Reads every doc in a given feedback folder (e.g. specs/v2_docs/) and updates the constitution — specs/mission.md, specs/tech-stack.md, specs/roadmap.md — to plan the next version. Synthesizes the feedback into discrete proposed changes, then walks through them one at a time via AskUserQuestion (never batched), mirroring align's one-finding-one-question discipline. Only touches the constitution, not individual spec folders — feature-spec still turns a resulting roadmap phase into an implementable spec. Use only when called directly, e.g. "/plan-new-version specs/v2_docs" or "plan the next version from this feedback folder".
user-invocable: true
---

# plan-new-version

Turns a folder of freeform feedback (stakeholder notes, user reports, a support-ticket
export — whatever landed in the folder) into an update to the project's constitution:
`specs/mission.md`, `specs/tech-stack.md`, `specs/roadmap.md`. The feedback folder is the
argument; its contents drive what changes, not this skill's own judgment about what the
product should do next.

**Hard rule: never call `Write` on `mission.md`, `tech-stack.md`, or `roadmap.md` until every
proposed change has been individually confirmed.** Compile the full list of proposed changes
first (workflow steps 3–4), but resolve them one at a time via `AskUserQuestion` — **one
question per call, never several proposed changes batched into one call's question array**.
This is the same discipline `align` uses for findings: a one-line heads-up with the total
count up front is fine, but each change gets its own question and its own resolution before
moving to the next. Don't fall back to "here are 6 proposed changes, which do you want?" as a
single multi-select — that defeats the purpose of asking one at a time.

**Hard rule: every sentence written into the constitution must trace to a specific passage in
the feedback folder or an explicit answer from this run.** If the feedback is ambiguous about
which file a change belongs in (mission vs. tech-stack vs. roadmap) or how to phase it, ask —
don't infer silently. This mirrors `create-constitution`'s "keep every sentence traceable"
principle, applied to updates instead of a first draft.

**Hard rule: every git-mutating command needs the user's explicit go-ahead in this
conversation before it runs** — `git checkout -b`, `git add`, `git commit`, `git push`, and
`gh pr create` are never authorized by answers to the per-change questions alone. Ask at two
checkpoints: once before branching (step 7) and once before commit/push/PR (step 9). A yes at
one checkpoint doesn't carry to the other, and doesn't carry to a future run of this skill.

## Workflow

1. **Resolve the feedback folder.** Take the folder path from the skill argument. If none was
   given, look for an obvious candidate (a folder under `specs/` whose name suggests feedback
   — e.g. `v2_docs`, `feedback`) and confirm it with the user rather than guessing silently;
   if nothing obvious exists, ask for the path directly. Read every file in the folder in
   full — don't sample or skim; feedback docs are often short enough to read completely, and
   a skipped file is a missed requirement.

2. **Read the constitution.** Load `specs/mission.md`, `specs/tech-stack.md`, and
   `specs/roadmap.md` in full. If any is missing, tell the user and stop — suggest running
   `create-constitution` first rather than inventing a baseline to diff against.

3. **Determine the version this plan targets.** Scan `roadmap.md` for the current version
   (e.g. a phase whose success criteria says "This marks version 1.0") and default to the
   next whole version number. If versioning isn't evident from `roadmap.md`, ask the user
   directly what version this plan is for — one question, not a guess.

4. **Synthesize the feedback into a numbered list of discrete proposed changes.** Read across
   every file in the folder and extract distinct, concrete items — a feature request, a
   renamed term, a UX complaint with an implied fix, a longer-term idea explicitly flagged as
   "eventually"/"later"/"future," etc. If the feedback itself already groups items (e.g. "do
   items 1–8 next, address future concepts after that"), treat that grouping as a strong
   starting signal for in-scope-now vs. `## Later (Not Yet Scheduled)` — but still confirm
   each item individually in step 5 rather than batch-accepting the doc's own framing,
   because a single feedback bullet sometimes bundles more than one real change (e.g. a
   rename plus a data-model change) that need separate resolution.

5. **Give a one-line heads-up, then walk through every proposed change one at a time.**
   State the total count up front (e.g. "Found 9 proposed changes across 1 feedback doc —
   let's go through them one at a time"). Then, for each change, in a **separate**
   `AskUserQuestion` call:
   - State what the feedback says (quote or closely paraphrase, with the source file).
   - Ask how to resolve it: in scope for this version's roadmap phase(s), deferred to
     `## Later (Not Yet Scheduled)`, rejected, or needs rework — options grounded in the
     specific change, not a generic accept/reject template.
   - If it's in scope, also resolve *where* it lands: does it change `mission.md` (a new
     persona, differentiator, or key feature), `tech-stack.md` (a new tool/integration the
     feedback implies, e.g. an IoT data source), and/or `roadmap.md` (a new phase item)? Ask
     this as part of the same finding's resolution rather than a separate pass, unless it's
     genuinely ambiguous enough to need its own follow-up question.
   - Don't proceed to the next change until the current one is resolved.

6. **Resolve structural questions the individual changes didn't settle**, each as its own
   `AskUserQuestion` call: phase granularity for the new roadmap version (one phase vs.
   several, mirroring how `roadmap.md`'s existing versions are broken up), and phase ordering
   if the in-scope changes don't have an obvious dependency sequence.

7. **Confirm, then create a branch.**
   - Ask for explicit go-ahead before running any git command (see hard rule above).
   - Branch name: `docs/plan-v<N>-YYYY-MM-DD` using the target version number from step 3 and
     today's date.
   - `git checkout -b` the branch before writing anything.

8. **Write the constitution updates**, built only from resolved changes (step 5) and
   structural answers (step 6):
   - **`roadmap.md`** is the primary deliverable: add the new version's phase(s) after the
     last existing phase, in the same shape as existing phases (`## Phase N: <name>`, Goal,
     checklist, Success criteria). Move any deferred-for-now items into `## Later (Not Yet
     Scheduled)` rather than dropping them. Don't touch the checklists or success criteria of
     already-`[x]`-checked phases — this skill plans forward, it doesn't rewrite shipped
     history (that's `align`'s job, if something there turns out to be stale).
   - **`mission.md`** only changes for items explicitly resolved as touching it in step 5
     (e.g. a new persona the feedback surfaces, a renamed term that appears in Key Features,
     a new differentiator). Leave it untouched if nothing in the feedback warranted a change.
   - **`tech-stack.md`** only changes for items explicitly resolved as touching it (e.g. a
     new integration, a new data store). Leave it untouched otherwise.

9. **Confirm, then commit, push, and open a draft PR.**
   - Ask for explicit go-ahead before running any git/gh command (see hard rule above) — the
     step-7 go-ahead doesn't cover this.
   - `git add` only the constitution files actually changed.
   - Commit message summarizing the version being planned and its source feedback folder.
   - Push with `-u` to origin.
   - `gh pr create` (open as draft, per `tech-stack.md`'s draft-PR convention) with a title
     naming the version and a body listing the resolved changes (in scope now, deferred to
     Later, rejected) and which files each touched. This PR is docs-only — note in the body
     that the CI checks have no code to run against, mirroring how `feature-spec` frames this
     for its own spec-only PRs. Leave it in draft; mark ready once it has a reviewer.

10. **Report** the branch name, PR URL, file paths changed, and a short summary of what
    landed in the new roadmap version vs. what got deferred to Later vs. rejected, so the
    user can spot anything to correct. Mention that `feature-spec` is the next step once
    they're ready to turn the new version's first phase into an implementable spec.

## Notes

- This skill never creates or edits files under `specs/YYYY-MM-DD-*/` — that's `feature-spec`
  scaffolding an actual phase spec once a roadmap phase exists to scaffold from.
- Read-and-ask, not read-and-guess: a feedback doc's prose is often informal (typos,
  stream-of-consciousness asides, a trailing "eventually" paragraph) — extract the concrete
  asks, but confirm interpretation rather than smoothing over ambiguity silently.
- If the same feedback folder is used again in a later run (e.g. a follow-up doc added after
  the first pass), treat already-incorporated items as such — check the current `roadmap.md`
  before re-proposing something that's already there.
