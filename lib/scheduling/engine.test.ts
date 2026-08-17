import assert from "node:assert/strict";
import test from "node:test";
import { findFreeSlots, scheduleWeek } from "./engine";

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 7, 17, hour, minute));

test("findFreeSlots clips occupied blocks and returns ordered gaps", () => {
  const slots = findFreeSlots(
    { startsAt: at(8), endsAt: at(17) },
    [
      { id: "meeting", title: "Meeting", startsAt: at(10), endsAt: at(11), flexibility: "fixed" },
      { id: "lunch", title: "Lunch", startsAt: at(12), endsAt: at(13), flexibility: "fixed" },
    ],
  );
  assert.deepEqual(slots, [
    { startsAt: at(8), endsAt: at(10) },
    { startsAt: at(11), endsAt: at(12) },
    { startsAt: at(13), endsAt: at(17) },
  ]);
});

test("scheduleWeek keeps fixed blocks and schedules earliest deadline first", () => {
  const result = scheduleWeek({
    range: { startsAt: at(8), endsAt: at(17) },
    occupied: [{ id: "meeting", title: "Meeting", startsAt: at(10), endsAt: at(11), flexibility: "fixed" }],
    minimumBreakMinutes: 15,
    tasks: [
      { id: "later", title: "Later", durationMinutes: 60, priority: "high", deadlineAt: at(17), flexibility: "flexible", splittable: false },
      { id: "soon", title: "Soon", durationMinutes: 90, priority: "medium", deadlineAt: at(12), flexibility: "flexible", splittable: false },
    ],
  });
  assert.equal(result.unscheduled.length, 0);
  assert.equal(result.placements[0].taskId, "soon");
  assert.equal(result.placements[0].startsAt.toISOString(), at(8).toISOString());
  assert.equal(result.placements[1].startsAt.toISOString(), at(11).toISOString());
});

test("scheduleWeek explains when a non-splittable task has no long slot", () => {
  const result = scheduleWeek({
    range: { startsAt: at(8), endsAt: at(12) },
    occupied: [{ id: "meeting", title: "Meeting", startsAt: at(9), endsAt: at(11), flexibility: "fixed" }],
    minimumBreakMinutes: 15,
    tasks: [{ id: "report", title: "Report", durationMinutes: 90, priority: "high", flexibility: "flexible", splittable: false }],
  });
  assert.equal(result.placements.length, 0);
  assert.equal(result.unscheduled[0].reason, "NO_CONTIGUOUS_SLOT");
});

test("scheduleWeek reserves the configured break after a new placement", () => {
  const result = scheduleWeek({
    range: { startsAt: at(8), endsAt: at(12) },
    occupied: [],
    minimumBreakMinutes: 15,
    tasks: [
      { id: "first", title: "First", durationMinutes: 60, priority: "high", flexibility: "flexible", splittable: false },
      { id: "second", title: "Second", durationMinutes: 60, priority: "medium", flexibility: "flexible", splittable: false },
    ],
  });
  assert.equal(result.placements[0].endsAt.toISOString(), at(9).toISOString());
  assert.equal(result.placements[1].startsAt.toISOString(), at(9, 15).toISOString());
});

test("scheduleWeek never schedules outside explicit allowed ranges", () => {
  const result = scheduleWeek({ range: { startsAt: at(0), endsAt: at(23) }, allowedRanges: [{ startsAt: at(8), endsAt: at(10) }, { startsAt: at(13), endsAt: at(15) }], occupied: [], minimumBreakMinutes: 15, maximumFocusMinutes: 120, tasks: [{ id: "report", title: "Report", durationMinutes: 180, priority: "high", flexibility: "flexible", splittable: true, minimumChunkMinutes: 30 }] });
  assert.deepEqual(result.placements.map((item) => [item.startsAt.toISOString(), item.endsAt.toISOString()]), [[at(8).toISOString(), at(10).toISOString()], [at(13).toISOString(), at(14).toISOString()]]);
});

test("scheduleWeek respects an explicitly empty capacity window", () => {
  const result = scheduleWeek({ range: { startsAt: at(8), endsAt: at(17) }, allowedRanges: [], occupied: [], minimumBreakMinutes: 15, tasks: [{ id: "holiday", title: "Holiday", durationMinutes: 60, priority: "medium", flexibility: "flexible", splittable: false }] });
  assert.equal(result.placements.length, 0);
});

test("scheduleWeek rejects an oversized non-splittable focus block", () => {
  const result = scheduleWeek({ range: { startsAt: at(8), endsAt: at(17) }, occupied: [], minimumBreakMinutes: 15, maximumFocusMinutes: 90, tasks: [{ id: "report", title: "Report", durationMinutes: 120, priority: "high", flexibility: "flexible", splittable: false }] });
  assert.equal(result.unscheduled[0].reason, "EXCEEDS_FOCUS_LIMIT");
});
