import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { firstValidationMessage } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";
import { taskInputSchema } from "@/lib/planner/validation";

export async function GET() {
  const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const tasks = await prisma.task.findMany({ where: { userId: session.userId, deletedAt: null }, include: { goal: { select: { id: true, title: true } }, scheduleBlocks: { where: { status: { in: ["PLANNED", "ACTIVE"] } }, orderBy: { startsAt: "asc" } } }, orderBy: [{ status: "asc" }, { deadlineAt: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ ok: true, tasks });
}

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const parsed = taskInputSchema.safeParse(await readJson(request)); if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));
  const input = parsed.data;
  if (input.goalId && !(await prisma.goal.findFirst({ where: { id: input.goalId, userId: session.userId } }))) return jsonError("Target bulanan tidak ditemukan.", 404);
  try {
    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({ data: { userId: session.userId, goalId: input.goalId || null, title: input.title, description: input.description || null, estimatedDurationMinutes: input.estimatedDurationMinutes, deadlineAt: input.deadlineAt, earliestStartAt: input.earliestStartAt, priority: input.priority, flexibility: input.flexibility, splittable: input.splittable, minimumChunkMinutes: input.splittable ? input.minimumChunkMinutes ?? 30 : null, status: input.flexibility === "FIXED" ? "SCHEDULED" : "UNSCHEDULED" } });
      if (input.flexibility === "FIXED" && input.fixedStartAt) {
        const block = await tx.scheduleBlock.create({ data: { userId: session.userId, taskId: created.id, title: created.title, startsAt: input.fixedStartAt, endsAt: new Date(input.fixedStartAt.getTime() + input.estimatedDurationMinutes * 60000), blockType: "TASK", flexibility: "FIXED", reminderOffsetMinutes: session.user.preference?.defaultReminderMinutes ?? 15, source: "MANUAL" } });
        const offset = block.reminderOffsetMinutes ?? 0;
        if (offset > 0) await tx.notificationJob.create({ data: { userId: session.userId, scheduleBlockId: block.id, idempotencyKey: `block:${block.id}:revision:1:offset:${offset}`, scheduledFor: new Date(block.startsAt.getTime() - offset * 60000) } });
      }
      await tx.auditEvent.create({ data: { userId: session.userId, action: "task.created", entityType: "Task", entityId: created.id } });
      return created;
    });
    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch { return jsonError("Tugas tidak dapat disimpan. Periksa kemungkinan benturan jadwal.", 409); }
}
