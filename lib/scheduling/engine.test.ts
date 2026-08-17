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
