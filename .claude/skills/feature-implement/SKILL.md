---
name: feature-implement
description: Implements the next incomplete task group from an active spec's plan.md, honoring requirements.md's scope/decisions and verifying against validation.md before reporting the group done. Use only when called directly (e.g. "run feature-implement," "/feature-implement") — do NOT use this skill for general requests to implement, continue, or build a feature; those should be handled as normal coding work, not by invoking this skill.
user-invocable: true
---

# feature-implement

Advances one spec folder under `specs/YYYY-MM-DD-feature-name/` by one task group: reads
`requirements.md` for the decisions already made, finds the next incomplete task group in
`plan.md`, implements it (feature code + its paired test task, per `plan.md`'s convention of
pairing every feature task with a test task), and checks the result against `validation.md`
before marking the group done.

**Hard rule: only run this skill when the user directly and explicitly invokes it by
name** (e.g. `/feature-implement`, "run feature-implement"). General requests like
"implement this feature," "keep building this," or "continue the work" are NOT this skill
— handle those as ordinary coding work using the spec files as context if relevant, without
going through this skill's workflow or its plan.md/validation.md bookkeeping.

**Hard rule: never run a git-mutating command (`git add`, `git commit`, `git push`, branch
creation/switching) without the user's explicit go-ahead in this specific conversation.**
This skill edits code and spec-tracking files in the working tree; it does not commit,
push, or open/update PRs on its own, regardless of any git permission granted earlier in
the conversation or in a prior run.

**Hard rule: never mark a task group complete if its verification step (against
validation.md) fails or can't be run.** Report the failure and stop — don't move on to the
next group with a known-broken one behind it.

## Workflow

1. **Locate the active spec directory.**
   - List folders under `specs/` that contain all three of `requirements.md`, `plan.md`,
     `validation.md`.
   - If the current git branch matches `spec/YYYY-MM-DD-<slug>`, prefer the folder with the
     matching date/slug. If that folder's plan.md has no incomplete task groups (see step
     3), say so rather than silently picking a different folder.
   - Otherwise, narrow to folders whose `plan.md` still has an incomplete task group. If
     exactly one qualifies, use it. If more than one qualifies, ask the user which one via
     AskUserQuestion (options = phase names/folder names) rather than guessing. If none
     qualify, tell the user every spec is fully implemented and stop.
   - If the current branch doesn't correspond to the folder you're about to work from, flag
     the mismatch and confirm before proceeding — implementing against the wrong branch is
     easy to do silently and hard to untangle after the fact.

2. **Read `requirements.md` first, in full.** Its "Scope" (in/out) and "Key decisions"
   sections are binding: implement only what's in scope, follow the recorded decisions
   (e.g. which library, which modeling approach) rather than re-deciding them, and don't
   implement anything the file lists as deferred even if it would be convenient to do while
   you're in the area.

3. **Find the next incomplete task group in `plan.md`.**
   - Task groups are the numbered `## N. <title>` sections. Track completion with a
     `**Status:** Not started | In progress | Complete` line directly under each heading.
   - If a group has no `**Status:**` line yet, treat it as `Not started` — this will be the
     common case the first time this skill touches an older plan.md. Add the line as you
     adopt the convention rather than rewriting the whole file's formatting.
   - The next incomplete group is the first one, top to bottom, that is not `Complete`.
     Groups are meant to be done in plan.md's order (it's sequenced deliberately, e.g. data
     layer before UI) — don't skip ahead to a later group even if it looks easier, unless
     the user is explicitly asking about a different group by name.

4. **Implement the group's tasks**, including its paired test task(s) (Vitest/RTL
   unit/component test, and a Playwright E2E test if the group is user-facing) — a group
   without its test task implemented isn't done, per `plan.md`'s own pairing convention.
   Stay inside this group's listed tasks; don't reach into later groups' work even if you
   notice it while in the same files.

5. **Verify against `validation.md`.**
   - Find the "Automated coverage checklist" items annotated with this group (e.g. "(Group
     N)"). Run the corresponding tests/commands locally and confirm they pass.
   - Also run lint/typecheck and, if practical, a production build if the group's changes
     could plausibly break them — catching this now is cheaper than in CI later.
   - Check off the matching `- [ ]` → `- [x]` items in validation.md's automated coverage
     checklist for this group only. Do **not** check off the "Merge gates" checklist (CI
     job checks, review approval) — those apply to the eventual implementation PR as a
     whole once all groups land, not to a single local task-group run, and this skill
     doesn't open or manage that PR.
   - If a test fails or a checklist item can't be verified, stop here: report what failed,
     leave the plan.md group's status as `In progress` (not `Complete`) and leave the
     validation.md item unchecked. Fix-and-retry within this same run is fine; silently
     marking it done is not.

6. **Mark the group `Complete` in `plan.md`** only after step 5 passes clean.

7. **Report**, without committing anything:
   - Which spec folder and task group were worked.
   - Files changed (code + the two spec files' status updates).
   - Test/verification results, and which validation.md items got checked off.
   - That `plan.md` now points at the next incomplete group (name it) for the next
     `feature-implement` run.
   - That committing/pushing is a separate step requiring explicit go-ahead in this
     conversation (per the hard rule above) — ask if the user wants that now, don't do it
     unprompted.

## Notes

- This skill doesn't touch `specs/roadmap.md` — marking a roadmap phase's checklist done is
  a judgment call across the whole phase (all its task groups, its manual verification, its
  merge gates), not something a single task-group run should decide.
- If `requirements.md`, `plan.md`, or `validation.md` is missing or looks incomplete (e.g.
  no task groups, or a group with no paired test task), say so and stop rather than
  inventing the missing structure — that's a sign the spec itself needs fixing via
  `feature-spec`, not something to patch over here.
- If every task group in the active plan.md is already `Complete`, don't re-run or
  re-verify them — tell the user the phase's implementation is done and that manual
  verification items in validation.md (e.g. real-device QA) and the merge gates are what's
  left before that phase's PR is ready.
