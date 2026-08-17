import type {
  ScheduledBlock,
  SchedulerInput,
  SchedulerResult,
  SchedulerTask,
  TaskPlacement,
  TimeRange,
} from "./types";

const MINUTE = 60_000;
const priorityScore = { urgent: 4, high: 3, medium: 2, low: 1 } as const;

function durationMinutes(range: TimeRange) {
  return Math.floor((range.endsAt.getTime() - range.startsAt.getTime()) / MINUTE);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE);
}

function sortOccupied(blocks: ScheduledBlock[]) {
  return [...blocks].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function findFreeSlots(range: TimeRange, occupied: ScheduledBlock[]): TimeRange[] {
  const slots: TimeRange[] = [];
  let cursor = range.startsAt;

  for (const block of sortOccupied(occupied)) {
    if (block.endsAt <= range.startsAt || block.startsAt >= range.endsAt) continue;
    const clippedStart = block.startsAt < range.startsAt ? range.startsAt : block.startsAt;
    const clippedEnd = block.endsAt > range.endsAt ? range.endsAt : block.endsAt;
    if (clippedStart > cursor) slots.push({ startsAt: cursor, endsAt: clippedStart });
    if (clippedEnd > cursor) cursor = clippedEnd;
  }

  if (cursor < range.endsAt) slots.push({ startsAt: cursor, endsAt: range.endsAt });
  return slots.filter((slot) => durationMinutes(slot) > 0);
}

function sortTasks(tasks: SchedulerTask[]) {
  return [...tasks].sort((a, b) => {
    const deadlineA = a.deadlineAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const deadlineB = b.deadlineAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return deadlineA - deadlineB || priorityScore[b.priority] - priorityScore[a.priority] || a.id.localeCompare(b.id);
  });
}

function placeChunk(
  task: SchedulerTask,
  slot: TimeRange,
  minutes: number,
): TaskPlacement {
  return {
    taskId: task.id,
    title: task.title,
    startsAt: slot.startsAt,
    endsAt: addMinutes(slot.startsAt, minutes),
    durationMinutes: minutes,
  };
}

function reservePlacement(
  placement: TaskPlacement,
  task: SchedulerTask,
  sequence: number,
  minimumBreakMinutes: number,
): ScheduledBlock {
  return {
    ...placement,
    id: `placement:${task.id}:${sequence}`,
    endsAt: addMinutes(placement.endsAt, minimumBreakMinutes),
    flexibility: task.flexibility,
  };
}

export function scheduleWeek(input: SchedulerInput): SchedulerResult {
  const placements: TaskPlacement[] = [];
  const unscheduled: SchedulerResult["unscheduled"] = [];
  const occupied = [...input.occupied];
  const allowedRanges = input.allowedRanges === undefined ? [input.range] : input.allowedRanges;
  const maximumFocusMinutes = input.maximumFocusMinutes ?? Number.MAX_SAFE_INTEGER;

  function availableSlots(task: SchedulerTask) {
    return allowedRanges.flatMap((allowed) => findFreeSlots(allowed, occupied)).map((slot) => ({
      startsAt: task.earliestStartAt && task.earliestStartAt > slot.startsAt ? task.earliestStartAt : slot.startsAt,
      endsAt: task.deadlineAt && task.deadlineAt < slot.endsAt ? task.deadlineAt : slot.endsAt,
    })).filter((slot) => slot.endsAt > slot.startsAt).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  for (const task of sortTasks(input.tasks)) {
    if (task.durationMinutes <= 0) {
      unscheduled.push({ taskId: task.id, title: task.title, remainingMinutes: task.durationMinutes, reason: "INVALID_WINDOW" });
      continue;
    }

    if (task.deadlineAt && task.earliestStartAt && task.deadlineAt <= task.earliestStartAt) {
      unscheduled.push({ taskId: task.id, title: task.title, remainingMinutes: task.durationMinutes, reason: "INVALID_WINDOW" });
      continue;
    }
    let remaining = task.durationMinutes;
    const candidateSlots = availableSlots(task);

    if (!task.splittable) {
      if (remaining > maximumFocusMinutes) {
        unscheduled.push({ taskId: task.id, title: task.title, remainingMinutes: remaining, reason: "EXCEEDS_FOCUS_LIMIT" });
        continue;
      }
      const slot = candidateSlots.find((candidate) => durationMinutes(candidate) >= remaining);
      if (!slot) {
        unscheduled.push({ taskId: task.id, title: task.title, remainingMinutes: remaining, reason: "NO_CONTIGUOUS_SLOT" });
        continue;
      }
      const placement = placeChunk(task, slot, remaining);
      placements.push(placement);
      occupied.push(reservePlacement(placement, task, placements.length, input.minimumBreakMinutes));
      continue;
    }

    const minimumChunk = Math.min(maximumFocusMinutes, Math.max(5, task.minimumChunkMinutes ?? 30));
    let safety = 0;
    while (remaining > 0 && safety < 100) {
      safety += 1;
      const slot = availableSlots(task).find((candidate) => {
        const available = Math.min(durationMinutes(candidate), maximumFocusMinutes);
        return available >= minimumChunk || remaining <= available;
      });
      if (!slot) break;
      const available = Math.min(durationMinutes(slot), maximumFocusMinutes);
      let chunk = Math.min(available, remaining);
      const remainder = remaining - chunk;
      if (remainder > 0 && remainder < minimumChunk && chunk - (minimumChunk - remainder) >= minimumChunk) chunk -= minimumChunk - remainder;
      if (chunk < minimumChunk && remaining > chunk) break;
      const placement = placeChunk(task, slot, chunk);
      placements.push(placement);
      occupied.push(reservePlacement(placement, task, placements.length, input.minimumBreakMinutes));
      remaining -= chunk;
    }

    if (remaining > 0) {
      unscheduled.push({ taskId: task.id, title: task.title, remainingMinutes: remaining, reason: "NO_CAPACITY" });
    }
  }

  return { placements, unscheduled };
}
