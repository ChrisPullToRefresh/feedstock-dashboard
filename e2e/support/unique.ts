import { randomUUID } from "node:crypto";

import type { TestInfo } from "@playwright/test";

/**
 * A name no other test will submit.
 *
 * `Producer.name` and `SequestrationSite.name` are `@unique`, and the whole
 * suite runs twice — once per project — against one database. So a suffix that
 * varied only per run would still collide: the mobile project would re-submit
 * the name the desktop project had already created, and `createProducer` would
 * answer with a refusal rather than a row.
 *
 * The project name is therefore part of it, alongside a random tail that keeps
 * two runs against the same local database apart.
 * `specs/2026-08-18-end-to-end-coverage/plan.md` § Decisions.
 */
export function uniqueName(prefix: string, testInfo: TestInfo): string {
  // randomUUID rather than Math.random().toString(36): the latter is not
  // guaranteed to yield the characters asked of it — 0.5 renders as "0.i", so
  // slice(2, 8) returns one — and a local database accumulates names across
  // runs. A repeat name hits the @unique constraint and surfaces as the form's
  // "that name is taken" refusal, which fails the spec on a missing link with
  // nothing pointing at the real cause.
  const tail = randomUUID().slice(0, 8);

  return `${prefix} ${testInfo.project.name} ${tail}`;
}
