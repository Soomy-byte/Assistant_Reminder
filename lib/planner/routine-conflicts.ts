import { materializeRoutineRanges, type RoutineRule } from "@/lib/planner/routines";
import type { TimeRange } from "@/lib/scheduling/types";
export function findRoutineConflict(candidate: RoutineRule, routines: RoutineRule[], blocks: Array<TimeRange & { id: string; title: string }>, range: TimeRange) {
  const occupied = [...materializeRoutineRanges(routines, range), ...blocks];
  for (const occurrence of materializeRoutineRanges([candidate], range)) {
    const conflict = occupied.find((item) => occurrence.startsAt < item.endsAt && occurrence.endsAt > item.startsAt);
    if (conflict) return { occurrence, conflict };
  }
  return null;
}
