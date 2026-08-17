import { buildAllowedRanges, materializeRoutineRanges } from "@/lib/planner/routines";
import { scheduleWeek } from "@/lib/scheduling/engine";
import type { SchedulerTask, TimeRange } from "@/lib/scheduling/types";

type Preference = { timezone: string; activeDays: number[]; sleepStartMinute: number; sleepEndMinute: number; minimumBreakMinutes: number; maximumFocusMinutes: number };
type TaskRecord = { id: string; title: string; estimatedDurationMinutes: number; priority: string; deadlineAt: Date | null; earliestStartAt: Date | null; flexibility: string; splittable: boolean; minimumChunkMinutes: number | null };
type BlockRecord = TimeRange & { id: string; title: string; flexibility: string };
type RoutineRecord = Parameters<typeof materializeRoutineRanges>[0][number];

function schedulerTask(task: TaskRecord): SchedulerTask {
  return { id: task.id, title: task.title, durationMinutes: task.estimatedDurationMinutes, priority: task.priority.toLowerCase() as SchedulerTask["priority"], deadlineAt: task.deadlineAt ?? undefined, earliestStartAt: task.earliestStartAt ?? undefined, flexibility: task.flexibility.toLowerCase() as SchedulerTask["flexibility"], splittable: task.splittable, minimumChunkMinutes: task.minimumChunkMinutes ?? undefined };
}

export function createScheduleResult(input: { range: TimeRange; preference: Preference; tasks: TaskRecord[]; blocks: BlockRecord[]; routines: RoutineRecord[] }) {
  const occurrences = materializeRoutineRanges(input.routines, input.range);
  const occupied = [...input.blocks.map((item) => ({ ...item, flexibility: item.flexibility.toLowerCase() as "fixed" | "flexible" })), ...occurrences.map((item) => ({ ...item, flexibility: item.flexibility.toLowerCase() as "fixed" | "flexible" }))];
  return scheduleWeek({ range: input.range, allowedRanges: buildAllowedRanges({ range: input.range, timezone: input.preference.timezone, activeDays: input.preference.activeDays, sleepStartMinute: input.preference.sleepStartMinute, sleepEndMinute: input.preference.sleepEndMinute }), occupied, minimumBreakMinutes: input.preference.minimumBreakMinutes, maximumFocusMinutes: input.preference.maximumFocusMinutes, tasks: input.tasks.map(schedulerTask) });
}
