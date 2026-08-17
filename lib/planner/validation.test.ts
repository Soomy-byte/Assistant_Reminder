import assert from "node:assert/strict";
import test from "node:test";
import { taskInputSchema } from "./validation";

const focusTask = {
  title: "Belajar TypeScript",
  description: null,
  estimatedDurationMinutes: 120,
  deadlineAt: "2026-08-21T16:59:00.000Z",
  earliestStartAt: null,
  priority: "MEDIUM" as const,
  flexibility: "FLEXIBLE" as const,
  splittable: true,
  minimumChunkMinutes: 30,
  fixedStartAt: null,
  goalId: null,
};

test("focus task accepts a date deadline and valid split size", () => {
  assert.equal(taskInputSchema.safeParse(focusTask).success, true);
});

test("focus task rejects a split size longer than the whole task", () => {
  const result = taskInputSchema.safeParse({ ...focusTask, minimumChunkMinutes: 180 });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues[0]?.message, "Durasi minimum setiap sesi tidak boleh melebihi total durasi tugas.");
});

test("scheduled activity requires an exact start time", () => {
  const result = taskInputSchema.safeParse({ ...focusTask, flexibility: "FIXED", splittable: false, minimumChunkMinutes: null, deadlineAt: null });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues[0]?.message, "Tugas tetap membutuhkan waktu mulai.");
});
