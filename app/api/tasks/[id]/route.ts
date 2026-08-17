import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { firstValidationMessage } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";
import { taskInputSchema, taskStatusSchema } from "@/lib/planner/validation";
type Context = { params: Promise<{ id: string }> };
async function owned(id: string, userId: string) { return prisma.task.findFirst({ where: { id, userId, deletedAt: null } }); }

export async function PUT(request: Request, context: Context) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const { id } = await context.params; if (!(await owned(id, session.userId))) return jsonError("Tugas tidak ditemukan.", 404);
  const parsed = taskInputSchema.safeParse(await readJson(request)); if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));
  const input = parsed.data;
  if (input.goalId && !(await prisma.goal.findFirst({ where: { id: input.goalId, userId: session.userId } }))) return jsonError("Target bulanan tidak ditemukan.", 404);
  try {
    const task = await prisma.$transaction(async (tx) => {
      const blocks = await tx.scheduleBlock.findMany({ where: { userId: session.userId, taskId: id, status: { in: ["PLANNED", "ACTIVE"] } } });
      if (blocks.length) {
        await tx.notificationJob.updateMany({ where: { userId: session.userId, scheduleBlockId: { in: blocks.map((b) => b.id) }, status: { in: ["SCHEDULED", "PROCESSING"] } }, data: { status: "CANCELLED" } });
        await tx.scheduleBlock.updateMany({ where: { id: { in: blocks.map((b) => b.id) }, userId: session.userId }, data: { status: "CANCELLED" } });
      }
      const updated = await tx.task.update({ where: { id }, data: { goalId: input.goalId || null, title: input.title, description: input.description || null, estimatedDurationMinutes: input.estimatedDurationMinutes, deadlineAt: input.deadlineAt, earliestStartAt: input.earliestStartAt, priority: input.priority, flexibility: input.flexibility, splittable: input.splittable, minimumChunkMinutes: input.splittable ? input.minimumChunkMinutes ?? 30 : null, status: input.flexibility === "FIXED" ? "SCHEDULED" : "UNSCHEDULED" } });
      if (input.flexibility === "FIXED" && input.fixedStartAt) {
        const block = await tx.scheduleBlock.create({ data: { userId: session.userId, taskId: id, title: input.title, startsAt: input.fixedStartAt, endsAt: new Date(input.fixedStartAt.getTime() + input.estimatedDurationMinutes * 60000), blockType: "TASK", flexibility: "FIXED", reminderOffsetMinutes: session.user.preference?.defaultReminderMinutes ?? 15, source: "MANUAL" } });
        const offset = block.reminderOffsetMinutes ?? 0; if (offset > 0) await tx.notificationJob.create({ data: { userId: session.userId, scheduleBlockId: block.id, idempotencyKey: `block:${block.id}:revision:1:offset:${offset}`, scheduledFor: new Date(block.startsAt.getTime() - offset * 60000) } });
      }
      return tx.task.findUniqueOrThrow({ where: { id: updated.id }, include: { goal: { select: { id: true, title: true } }, scheduleBlocks: { where: { status: { in: ["PLANNED", "ACTIVE"] } }, orderBy: { startsAt: "asc" } } } });
    });
    return NextResponse.json({ ok: true, task });
  } catch { return jsonError("Perubahan ditolak karena menyebabkan konflik jadwal.", 409); }
}

export async function PATCH(request: Request, context: Context) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const { id } = await context.params; if (!(await owned(id, session.userId))) return jsonError("Tugas tidak ditemukan.", 404);
  const parsed = taskStatusSchema.safeParse(await readJson(request)); if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));
  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({ where: { id }, data: { status: parsed.data.status } });
    if (parsed.data.status === "COMPLETED") { await tx.scheduleBlock.updateMany({ where: { userId: session.userId, taskId: id, status: { in: ["PLANNED", "ACTIVE", "MISSED"] } }, data: { status: "COMPLETED" } }); await tx.notificationJob.updateMany({ where: { userId: session.userId, scheduleBlock: { taskId: id }, status: { in: ["SCHEDULED", "PROCESSING"] } }, data: { status: "CANCELLED" } }); }
    if (parsed.data.status === "UNSCHEDULED") { await tx.notificationJob.updateMany({ where: { userId: session.userId, scheduleBlock: { taskId: id }, status: { in: ["SCHEDULED", "PROCESSING"] } }, data: { status: "CANCELLED" } }); await tx.scheduleBlock.updateMany({ where: { userId: session.userId, taskId: id, status: { in: ["PLANNED", "ACTIVE"] } }, data: { status: "CANCELLED" } }); }
    return updated;
  });
  return NextResponse.json({ ok: true, task });
}

export async function DELETE(request: Request, context: Context) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const { id } = await context.params; if (!(await owned(id, session.userId))) return jsonError("Tugas tidak ditemukan.", 404);
  await prisma.$transaction([prisma.notificationJob.updateMany({ where: { userId: session.userId, scheduleBlock: { taskId: id }, status: { in: ["SCHEDULED", "PROCESSING"] } }, data: { status: "CANCELLED" } }), prisma.scheduleBlock.updateMany({ where: { userId: session.userId, taskId: id, status: { in: ["PLANNED", "ACTIVE"] } }, data: { status: "CANCELLED" } }), prisma.task.update({ where: { id }, data: { status: "CANCELLED", deletedAt: new Date() } })]);
  return NextResponse.json({ ok: true });
}
