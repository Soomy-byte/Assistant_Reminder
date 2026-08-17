import assert from "node:assert/strict";
import test from "node:test";
import { rangesOverlap, validateManualScheduleRange } from "./manual-schedule";

const base = {
  timezone: "Asia/Jakarta",
  sleepStartMinute: 22 * 60,
  sleepEndMinute: 6 * 60,
};

test("manual schedule accepts an awake daytime range", () => {
  assert.deepEqual(validateManualScheduleRange({ ...base, startsAt: new Date("2026-08-17T01:00:00Z"), endsAt: new Date("2026-08-17T02:00:00Z") }), { ok: true });
});

test("manual schedule rejects ranges inside configured sleep time", () => {
  assert.deepEqual(validateManualScheduleRange({ ...base, startsAt: new Date("2026-08-17T16:00:00Z"), endsAt: new Date("2026-08-17T17:00:00Z") }), { ok: false, message: "Jadwal berada di dalam jam tidur yang kamu atur." });
});

test("manual schedule respects earliest start and deadline", () => {
  assert.equal(validateManualScheduleRange({ ...base, startsAt: new Date("2026-08-17T01:00:00Z"), endsAt: new Date("2026-08-17T02:00:00Z"), earliestStartAt: new Date("2026-08-17T01:30:00Z") }).ok, false);
  assert.equal(validateManualScheduleRange({ ...base, startsAt: new Date("2026-08-17T01:00:00Z"), endsAt: new Date("2026-08-17T02:00:00Z"), deadlineAt: new Date("2026-08-17T01:30:00Z") }).ok, false);
});

test("half-open ranges allow adjacent blocks but reject overlaps", () => {
  const first = { startsAt: new Date("2026-08-17T01:00:00Z"), endsAt: new Date("2026-08-17T02:00:00Z") };
  assert.equal(rangesOverlap(first, { startsAt: new Date("2026-08-17T02:00:00Z"), endsAt: new Date("2026-08-17T03:00:00Z") }), false);
  assert.equal(rangesOverlap(first, { startsAt: new Date("2026-08-17T01:30:00Z"), endsAt: new Date("2026-08-17T02:30:00Z") }), true);
});
