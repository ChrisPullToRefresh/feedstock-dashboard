---
name: pr-merged-branch-deleted
description: Tell Claude that the pull request has been merged and its feature branch deleted. Use only when called directly.
disable-model-invocation: true
---

I have merged the PR and deleted the feature branch.

Prune the branch's Neon database branch too — `specs/tech-stack.md` § Branching & pull
request workflow, Cleanup. Vercel's Neon integration created one for the branch's first
preview deployment and does not remove it when the git branch goes, so they accumulate
until a later, unrelated pull request fails its preview with "Branch limit reached".

Run it, with the git branch that was just merged:

```bash
.claude/skills/pr-merged-branch-deleted/prune-neon-branch.sh <git-branch>
```

It reads a project-scoped `NEON_API_KEY` and `NEON_PROJECT_ID` from `.env.local`, matches
the git branch's own name or Vercel's `preview/` form of it, and deletes that branch. It
refuses the default and protected branches, so it cannot take `main` — that is production.

Report what it actually printed. "Nothing to prune" is a real and common outcome — the
branch may already have been deleted by hand — and it is not the same as having deleted
something. Never report the cleanup done on the strength of having run the command; report
it done because the command said so.
