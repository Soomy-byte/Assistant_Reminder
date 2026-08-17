import { buildAllowedRanges } from "@/lib/planner/routines";

type ManualScheduleInput = {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  sleepStartMinute: number;
  sleepEndMinute: number;
  earliestStartAt?: Date | null;
  deadlineAt?: Date | null;
};

export type ManualScheduleValidation = { ok: true } | { ok: false; message: string };

export function rangesOverlap(a: { startsAt: Date; endsAt: Date }, b: { startsAt: Date; endsAt: Date }) {
  return a.startsAt < b.endsAt && a.endsAt > b.startsAt;
}

export function validateManualScheduleRange(input: ManualScheduleInput): ManualScheduleValidation {
  if (!Number.isFinite(input.startsAt.getTime()) || !Number.isFinite(input.endsAt.getTime()) || input.endsAt <= input.startsAt) {
    return { ok: false, message: "Jam selesai harus setelah jam mulai." };
  }

  const durationMinutes = (input.endsAt.getTime() - input.startsAt.getTime()) / 60000;
  if (durationMinutes < 15) return { ok: false, message: "Durasi jadwal minimal 15 menit." };
  if (durationMinutes > 1440) return { ok: false, message: "Durasi jadwal maksimal 24 jam." };
  if (input.earliestStartAt && input.startsAt < input.earliestStartAt) return { ok: false, message: "Jadwal lebih awal dari batas mulai tugas." };
  if (input.deadlineAt && input.endsAt > input.deadlineAt) return { ok: false, message: "Jadwal melewati deadline tugas." };

  const awakeRanges = buildAllowedRanges({
    range: { startsAt: input.startsAt, endsAt: input.endsAt },
    timezone: input.timezone,
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    sleepStartMinute: input.sleepStartMinute,
    sleepEndMinute: input.sleepEndMinute,
  });
  if (!awakeRanges.some((range) => range.startsAt <= input.startsAt && range.endsAt >= input.endsAt)) {
    return { ok: false, message: "Jadwal berada di dalam jam tidur yang kamu atur." };
  }

  return { ok: true };
}
