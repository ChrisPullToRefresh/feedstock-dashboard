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
creation/switching, opening/updating a PR) without the user's explicit go-ahead in this
specific conversation.** This skill edits code and spec-tracking files in the working tree;
it does not commit, push, or open/update a PR on its own, regardless of any git permission
granted earlier in the conversation or in a prior run. Branch creation happens *before*
implementation (see workflow step 1a), on its own go-ahead — it is not bundled with the
later commit/push/PR step. Once the user separately gives go-ahead for that later step,
treat commit + push + open-or-update-the-task-group-PR as one step per tech-stack.md's PR
practice (see workflow step 8) — don't stop after pushing and make the user ask separately
for the PR.

**Hard rule: never commit — or implement a task group's code — directly on `main`, under
any circumstance, for any reason, including an explicit user instruction to do so.** If the
current branch is `main` (or whatever this repo's default branch is) when you're about to
start step 4's implementation, that is a stop condition: do not write any code yet, and do
not wait until commit time to deal with it. See workflow step 1a — create and switch to the
spec branch first, with the user's go-ahead, before any file changes. This is a change from
this skill's earlier behavior of creating the branch only at commit time; that let a full
task group get implemented on `main` before the branch question ever came up, which is
confusing and easy to implement-then-forget. A bare "commit this" or "push it" from the user
authorizes committing/pushing *a feature branch*; it is never authorization to commit or push
`main` directly, no matter how plainly the user says it, because `main` has no branch
protection in this repo and Vercel's GitHub integration deploys automatically on anything
that lands on `main` (tech-stack.md) — so a direct push is an unreviewed production deploy,
not merely a git-history slip. If the user explicitly says the word "main" (e.g. "push to
main," "commit directly to main"), stop and confirm in plain language that this skips the
PR/CI/review process and will trigger a production deploy before doing it — do not treat
silence or a generic "yes" to an earlier, differently-worded question as covering this.

**Hard rule: never mark a task group complete if its verification step (against
validation.md) fails or can't be run.** Report the failure and stop — don't move on to the
next group with a known-broken one behind it.

**Hard rule: never run a command that deploys to Vercel from this skill** (`vercel deploy`,
`vercel --prod`, `vercel --yes`/`vercel -y`, or any other invocation that uploads a build).
Per tech-stack.md, deploys happen only through Vercel's GitHub integration when a PR is
pushed/merged — never from the local CLI. This applies even to a task explicitly named
"deploy" or "confirm an initial deploy succeeds" in plan.md: satisfy it by pushing a branch
(with the user's go-ahead, per the git-mutating hard rule above) and pointing at the
resulting GitHub-triggered deployment (e.g. the preview URL Vercel posts on the PR, or the
production deployment after merge), not by deploying yourself. One-time external setup that
doesn't push code — `vercel link`, `vercel git connect` to attach an already-existing repo,
provisioning a database — is not a deploy and is fine, but confirm with the user first since
it creates or modifies external account resources.

## Workflow

1. **Locate the active spec directory.**
   - List folders under `specs/` that contain all three of `requirements.md`, `plan.md`,
     `validation.md`.
   - If the current git branch matches `spec/YYYY-MM-DD-<slug>-group-<N>`, prefer the folder
     with the matching date/slug (the `-group-<N>` suffix also tells you which task group
     that branch was created for — see step 3). If that folder's plan.md has no incomplete
     task groups (see step 3), say so rather than silently picking a different folder.
   - Otherwise, narrow to folders whose `plan.md` still has an incomplete task group. If
     exactly one qualifies, use it. If more than one qualifies, ask the user which one via
     AskUserQuestion (options = phase names/folder names) rather than guessing. If none
     qualify, tell the user every spec is fully implemented and stop.
   - If the current branch doesn't correspond to the folder you're about to work from —
     including the common case where it's `main` because a prior task group's branch was
     already merged and deleted — this is not just a flag-and-continue: go to step 1a below
     before touching any file.

1a. **Create (or switch to) the task group's branch before implementing anything**, if the
   current branch isn't already it.
   - Branch naming is per task group, not per phase/spec-folder:
     `spec/YYYY-MM-DD-<slug>-group-<N>` (spec folder name plus `-group-<N>` for the group
     number being implemented, e.g. `spec/2026-07-29-producers-sequestration-sites-group-2`).
     This matters because branches get deleted per task group as each one's PR merges — a
     phase-wide branch name (no `-group-<N>`) is easy to confuse with a still-open or
     already-deleted branch from a *different* group in the same phase. Never reuse a bare
     `spec/YYYY-MM-DD-<slug>` branch across groups.
   - Post a standalone message — not folded into other narration — stating: which spec
     folder and task group (number/title) you're about to implement, what branch you're
     currently on, and the exact branch name you intend to create.
   - Wait for the user's explicit go-ahead on that message.
   - Once given, create the branch off the current tip of `main` and switch to it
     (`git checkout -b spec/YYYY-MM-DD-<slug>-group-<N>`) — this is the one exception to
     "don't create branches without go-ahead": the go-ahead you just got *is* that
     authorization, scoped only to creating/switching this branch, not to committing or
     pushing.
   - Only after switching does step 4's implementation begin. If the branch already existed
     (e.g. a second `feature-implement` run continuing the same group's work), just switch to
     it — no need to re-ask.

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
     job checks, review approval) — those apply to the PR as a whole once CI has actually
     run remotely and a reviewer has approved, neither of which this local run can confirm
     (see step 8 for this skill's PR handling).
   - If a test fails or a checklist item can't be verified, stop here: report what failed,
     leave the plan.md group's status as `In progress` (not `Complete`) and leave the
     validation.md item unchecked. Fix-and-retry within this same run is fine; silently
     marking it done is not.

6. **Mark the group `Complete` in `plan.md`** only after step 5 passes clean.

6a. **If that was the last incomplete task group, sync `specs/roadmap.md`.**
   - Check whether every task group in `plan.md` is now `Complete`. If any group is still
     `Not started` or `In progress`, skip this step — roadmap.md stays untouched until the
     whole spec is done.
   - If the whole spec is now complete, find this phase's section in `specs/roadmap.md`
     (match it via `requirements.md`'s "Goal" line, which cites the phase name/number) and
     check off `- [ ]` → `- [x]` for every checklist item listed in `requirements.md`'s "In
     scope" section — those are the roadmap items this spec's `plan.md` was built to cover.
   - Only check off items `requirements.md`'s "In scope" list actually names. If the phase's
     roadmap checklist has an item that section doesn't cover, leave it unchecked and flag
     it to the user in step 7's report — that's a sign the phase isn't fully done yet, not
     something to silently check off.
   - This keeps `roadmap.md` from silently drifting out of sync with a spec's real
     completion status — previously this required a separate `/align` run to catch (e.g.
     Phase 2's checkboxes staying unchecked after all 3 of its task groups had already
     shipped). It's a working-tree edit like the `plan.md`/`validation.md` status updates
     elsewhere in this step: no separate go-ahead beyond what already governs this skill's
     non-git file edits, and still subject to the same commit go-ahead in step 8 before it's
     committed.

7. **Report**, without committing anything:
   - Which spec folder and task group were worked.
   - Files changed (code + the two spec files' status updates, plus `specs/roadmap.md` if
     step 6a fired).
   - Test/verification results, and which validation.md items got checked off.
   - If step 6a fired, say so explicitly and name which roadmap.md items got checked (or, if
     any in-scope item didn't have a matching roadmap checklist entry, flag that mismatch
     instead of silently resolving it).
   - That `plan.md` now points at the next incomplete group (name it) for the next
     `feature-implement` run — or, if step 6a fired, that this spec's phase is fully done and
     roadmap.md now reflects it.
   - That committing/pushing/opening-or-updating the PR is a separate step requiring
     explicit go-ahead in this conversation (per the hard rules above) — ask if the user
     wants that now, don't do it unprompted, and frame it as one combined step (not "push,
     then separately ask about a PR"). State plainly what branch that commit would land on
     (the spec branch created in step 1a) — this should already be the current branch by
     this point, not a decision still pending.

8. **Once given the go-ahead, commit, push, and open or update the task-group PR** — this
   is one step, not three separate asks. The branch already exists and is checked out from
   step 1a, so this step is commit/push/PR only, not branch creation. Per tech-stack.md's PR
   practice:
   - **Branch/base:** head is the current task-group branch (e.g.
     `spec/YYYY-MM-DD-<slug>-group-<N>`), base is `main`.
   - **Check for an existing open PR** for this branch first (e.g. `gh pr list --head
     <branch> --state open`). This repo's convention is one PR per task group, or a small
     bundle of consecutive groups landed together (see prior PRs' titles/bodies for the
     pattern) — if an open PR already covers this branch (e.g. a second `feature-implement`
     run continuing the same PR), **update its description** rather than opening a
     duplicate: fold this group's summary/test-plan into the existing body instead of
     replacing what's already there.
   - **If none exists, open one as a draft** (`gh pr create --draft`), titled
     `Phase <N>, Group <M>[–<M2>]: <short description>` (match the phase number from
     `specs/roadmap.md` and the group title(s) from `plan.md`), with a body containing:
     - `## Summary` — bullet points of what changed, referencing the spec folder/group(s).
     - `## Test plan` — a checklist mirroring this run's verification: check off what you
       actually ran and confirmed locally (lint, typecheck, unit tests, build, any manual
       check like hitting a health endpoint); leave CI, PR review, and any
       Vercel-preview/real-device manual-verification items from validation.md **unchecked**
       with a short note on why (they can't be verified from this local run).
   - **Never mark the PR "ready for review" yourself.** Per tech-stack.md, that transition
     only happens once GitHub Actions has run on the pushed branch and gone green — this
     skill runs locally and can't observe that. Leave the PR in draft and tell the user to
     mark it ready once CI is green and the test plan is fully filled in.

9. **After pushing, monitor CI until it finishes — don't just push and move on.** Watch the
   checks on the pushed branch (e.g. `gh pr checks <branch> --watch`, or `gh run watch
   --exit-status` on the run the push triggered) instead of telling the user to go check
   GitHub later themselves.
   - **If every check goes green:** tell the user CI passed and that the PR is ready for
     them to flip to "ready for review" — this skill still never flips that switch itself
     (see the rule above).
   - **If any check fails:** pull the failure detail (e.g. `gh run view <run-id>
     --log-failed`), report which check(s) failed and why, and leave the PR in draft. Stop
     there — don't silently retry, don't push a fix without the user's direction, and don't
     tell the user CI is "probably fine" or otherwise soften a real failure.
   - This step applies whether step 8 opened a new PR or updated an existing one — either
     way, the push just happened and its CI run is what gets watched.

## Notes

- This skill only touches `specs/roadmap.md` via step 6a, and only at the moment a spec's
  final task group completes — matching `requirements.md`'s recorded "In scope" items to
  that phase's checklist. It never touches roadmap.md mid-phase (a single task-group
  completion doesn't imply the phase is done) or for phases with no active spec.
- If `requirements.md`, `plan.md`, or `validation.md` is missing or looks incomplete (e.g.
  no task groups, or a group with no paired test task), say so and stop rather than
  inventing the missing structure — that's a sign the spec itself needs fixing via
  `feature-spec`, not something to patch over here.
- If every task group in the active plan.md is already `Complete`, don't re-run or
  re-verify them — tell the user the phase's implementation is done and that manual
  verification items in validation.md (e.g. real-device QA) and the merge gates are what's
  left before that phase's PR is ready.
