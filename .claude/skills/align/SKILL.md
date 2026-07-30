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
scope. It's an audit, not a fixer — it reports, then asks before touching anything.

**Hard rule: only run this skill when the user directly and explicitly invokes it by name**
(e.g. `/align`, "run align") or explicitly asks to align/audit the project docs. General
requests like "check the docs" or "does this look right" are NOT automatically this skill —
use judgment, and if it's ambiguous, ask.

**Hard rule: read-only unless and until the user asks for a fix.** This skill never edits
`mission.md`, `tech-stack.md`, `roadmap.md`, or any file under `specs/*/` on its own. It
produces a report; fixing individual findings afterward is ordinary spec-editing work the
user opts into per finding (or in a batch), not something this skill does automatically —
and any resulting commit/push still needs the user's explicit go-ahead per this repo's
standing git rules.

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

6. **Report**, grouped by category (Contradictions, Stale Claims, Scope Drift), most
   consequential first within each group. Each finding: a one-line summary, the two citations
   it's built on (file + section), and why they conflict. If a category is empty, say so
   explicitly ("No contradictions found") rather than omitting the section — a clean bill of
   health is a result, not silence. Close with a count summary (e.g. "3 contradictions, 1
   stale claim, 2 scope-drift items across 2 spec folders").

7. **Ask which findings, if any, to fix now.** Don't fix anything unprompted. If the user
   picks findings to fix, treat each as normal spec-editing work in the relevant file(s) —
   this skill's job ends at the report and that follow-up conversation, not a separate
   fix-mode workflow.

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
