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

There is no `NEON_API_KEY` in this project, so this cannot be scripted yet: say plainly
that the Neon branch needs deleting in the console and name the branch, rather than
reporting the cleanup done.
