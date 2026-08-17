export type Flexibility = "fixed" | "flexible";
export type Priority = "low" | "medium" | "high" | "urgent";

export type TimeRange = {
  startsAt: Date;
  endsAt: Date;
};

export type SchedulerTask = {
  id: string;
  title: string;
  durationMinutes: number;
  priority: Priority;
  deadlineAt?: Date;
  earliestStartAt?: Date;
  flexibility: Flexibility;
  splittable: boolean;
  minimumChunkMinutes?: number;
};

export type ScheduledBlock = TimeRange & {
  id: string;
  title: string;
  flexibility: Flexibility;
};

export type SchedulerInput = {
  range: TimeRange;
  allowedRanges?: TimeRange[];
  tasks: SchedulerTask[];
  occupied: ScheduledBlock[];
  minimumBreakMinutes: number;
  maximumFocusMinutes?: number;
};

export type TaskPlacement = TimeRange & {
  taskId: string;
  title: string;
  durationMinutes: number;
};

export type UnscheduledTask = {
  taskId: string;
  title: string;
  remainingMinutes: number;
  reason: "NO_CAPACITY" | "NO_CONTIGUOUS_SLOT" | "INVALID_WINDOW" | "EXCEEDS_FOCUS_LIMIT";
};

export type SchedulerResult = {
  placements: TaskPlacement[];
  unscheduled: UnscheduledTask[];
};
