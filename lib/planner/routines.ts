import { addDateKeyDays, dateKeyWeekday, localDateKey, localDateTimeToUtc, minuteParts } from "@/lib/planner/time";
import type { TimeRange } from "@/lib/scheduling/types";

export type RoutineRule = { id: string; title: string; timezone: string; startMinute: number; endMinute: number; recurrence: unknown; flexibility: string };
function days(recurrence: unknown) { if (!recurrence || typeof recurrence !== "object" || !("daysOfWeek" in recurrence)) return []; const value = (recurrence as { daysOfWeek?: unknown }).daysOfWeek; return Array.isArray(value) ? [...new Set(value.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6))] : []; }

export function materializeRoutineRanges(routines: RoutineRule[], range: TimeRange) {
  const result: Array<TimeRange & { id: string; routineId: string; title: string; flexibility: string }> = [];
  for (const routine of routines) {
    let key = addDateKeyDays(localDateKey(range.startsAt, routine.timezone), -1);
    const finalKey = addDateKeyDays(localDateKey(range.endsAt, routine.timezone), 1);
    while (key <= finalKey) {
      if (days(routine.recurrence).includes(dateKeyWeekday(key))) {
        const startsAt = localDateTimeToUtc(minuteParts(key, routine.startMinute), routine.timezone);
        const endKey = routine.endMinute <= routine.startMinute ? addDateKeyDays(key, 1) : key;
        const endsAt = localDateTimeToUtc(minuteParts(endKey, routine.endMinute), routine.timezone);
        if (startsAt < range.endsAt && endsAt > range.startsAt) result.push({ id: `routine:${routine.id}:${key}`, routineId: routine.id, title: routine.title, startsAt, endsAt, flexibility: routine.flexibility });
      }
      key = addDateKeyDays(key, 1);
    }
  }
  return result.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function buildAllowedRanges(input: { range: TimeRange; timezone: string; activeDays: number[]; sleepStartMinute: number; sleepEndMinute: number }) {
  const result: TimeRange[] = [];
  let key = localDateKey(input.range.startsAt, input.timezone);
  const finalKey = localDateKey(input.range.endsAt, input.timezone);
  while (key <= finalKey) {
    if (input.activeDays.includes(dateKeyWeekday(key))) {
      const startsAt = localDateTimeToUtc(minuteParts(key, input.sleepEndMinute), input.timezone);
      const endKey = input.sleepStartMinute <= input.sleepEndMinute ? addDateKeyDays(key, 1) : key;
      const endsAt = localDateTimeToUtc(minuteParts(endKey, input.sleepStartMinute), input.timezone);
      const clippedStart = startsAt < input.range.startsAt ? input.range.startsAt : startsAt;
      const clippedEnd = endsAt > input.range.endsAt ? input.range.endsAt : endsAt;
      if (clippedEnd > clippedStart) result.push({ startsAt: clippedStart, endsAt: clippedEnd });
    }
    key = addDateKeyDays(key, 1);
  }
  return result;
}
