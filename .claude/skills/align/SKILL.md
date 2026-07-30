---
name: align
description: Audits the project's constitution (specs/mission.md, specs/tech-stack.md, specs/roadmap.md) and every feature-spec under specs/YYYY-MM-DD-*/ for contradictions, stale claims, and scope drift. Read-only — reports findings, never edits files on its own. Use only when the user explicitly invokes it (e.g. "/align", "run align") or explicitly asks to align/audit the project docs.
user-invocable: true
---

# align

Cross-checks every planning doc in the repo against every other one and reports where they've
drifted apart: the constitution (`mission.md`, `tech-stack.md`, `roadmap.md`) contradicting
itself, a spec contradicting the constitution or another spec, a doc asserting something the
rest of the repo shows is no longer true, or a spec doing more or less than its own stated
scope. It's an audit, not a fixer — it walks through findings one at a time and asks before
touching anything.

**Hard rule: only run this skill when the user directly and explicitly invokes it by name**
(e.g. `/align`, "run align") or explicitly asks to align/audit the project docs. General
requests like "check the docs" or "does this look right" are NOT automatically this skill —
use judgment, and if it's ambiguous, ask.

**Hard rule: read-only unless and until the user asks for a fix.** This skill never edits
`mission.md`, `tech-stack.md`, `roadmap.md`, or any file under `specs/*/` on its own. Fixing
a finding is ordinary spec-editing work the user opts into for that finding specifically, not
something this skill does automatically — and any resulting commit/push still needs the
user's explicit go-ahead per this repo's standing git rules.

**Hard rule: present findings one at a time via `AskUserQuestion`, never as a single batch
dump.** Compile the full set of findings first (steps 3–5), but don't print them all in one
message followed by one blanket "which do you want to fix" question — that's the failure
mode this rule exists to prevent. A one-line heads-up with the total count and category
breakdown is fine up front (e.g., "Found 3 issues: 1 contradiction, 2 stale claims — let's go
through them one at a time."); the findings themselves are delivered and decided on
individually, most consequential first, per step 7.

**Hard rule: every finding must cite concrete text on both sides of the conflict** (file +
section/heading, quoted or closely paraphrased) — a vague sense that something seems off
without two citable passages that actually disagree is not a finding. Precision here is what
makes the report actionable instead of noise.

## Workflow

1. **Read the constitution in full:** `specs/mission.md`, `specs/tech-stack.md`,
   `specs/roadmap.md`. If any is missing, say so and note that constitution-level checks are
   limited to what exists — don't fabricate the missing file's content to compare against.

2. **Enumerate every spec folder** under `specs/YYYY-MM-DD-*/`. For each one that has all
   three of `requirements.md`, `plan.md`, `validation.md`, read them in full. If a folder is
   missing one of the three, flag that as a finding on its own (structural — treat it like a
   stale/incomplete doc) rather than silently skipping the folder.

3. **Check for contradictions** — two passages assert incompatible facts:
   - A spec's `requirements.md` "Key decisions" vs. `tech-stack.md`'s fixed choices (e.g. a
     spec re-deciding something tech-stack.md already settled, without citing it as a
     deliberate, recorded override).
   - Two specs disagreeing on a shared decision (auth model, data model, conventions) with
     neither explicitly superseding the other.
   - A spec's own internal contradiction (e.g. `requirements.md`'s scope list vs. its own "Key
     decisions" section describing something different).
   - `roadmap.md`'s phase description/checklist vs. that phase's actual `requirements.md`
     scope.

4. **Check for stale claims** — a passage was true when written but the rest of the repo now
   shows otherwise:
   - `roadmap.md` checklist items left unchecked (`- [ ]`) for a phase whose spec `plan.md`
     shows the corresponding task group(s) as `Complete` (or the reverse — checked off with
     incomplete groups behind it).
   - A constitution-level addition (e.g. a new `tech-stack.md` practice) made after a spec was
     scaffolded, where that spec's `requirements.md`/`plan.md`/`validation.md` was never
     updated to reflect it — the kind of gap this project closed by hand for the commit-message
     linting requirement; `align` should catch the *next* one automatically.
   - A spec describing a route/flow/decision that a later decision (in the same file or
     another spec) reversed, where the earlier description was never updated or marked
     superseded.

5. **Check for scope drift** — a spec doing more or less than it claims:
   - `plan.md` task groups or `validation.md` checklist items covering work `requirements.md`
     lists as out of scope or doesn't mention at all.
   - `requirements.md` in-scope items with no corresponding `plan.md` task group (claimed but
     never actually planned).
   - A phase's `roadmap.md` checklist and its spec's `requirements.md` "In scope" list
     covering different sets of items, in either direction.

6. **Compile findings** across all three categories (Contradictions, Stale Claims, Scope
   Drift) and rank them most consequential first overall. If every category is empty, say so
   directly — e.g. "No contradictions, stale claims, or scope drift found across N spec
   folders" — and stop; there's nothing to walk through.

7. **Walk through findings one at a time.** Give the one-line heads-up (total count + category
   breakdown per the hard rule above), then for each finding in ranked order:
   - State it: a one-line summary, the two citations it's built on (file + section, quoted or
     closely paraphrased), and why they conflict.
   - Use `AskUserQuestion` to ask what to do with this specific finding — options along the
     lines of "Fix now" and "Skip for now" (the tool always offers a free-form "Other" too).
   - If the answer is to fix it, do that fix now as ordinary spec-editing work in the
     relevant file(s), then move to the next finding. If it's to skip, move on without
     changing anything for that finding.
   - Don't proceed to the next finding until the current one is resolved one way or the
     other. Never fall back to listing several findings in one message with a single combined
     question — one finding, one question, one resolution, then the next.

## Notes

- This skill only reads/reports on `specs/mission.md`, `specs/tech-stack.md`,
  `specs/roadmap.md`, and files under `specs/*/`. It doesn't inspect application code —
  "does the code match the spec" is a different, larger question than "do the docs agree with
  each other," and out of scope here.
- Findings are about disagreement between documented claims, not code review or opinions
  about whether a past decision was good — a decision can be perfectly reasonable and still
  contradict an earlier one that was never explicitly superseded; that's still a finding.
- Re-running `align` after fixes is expected and cheap — it's meant to be run periodically or
  after a batch of spec/constitution edits, not just once.
