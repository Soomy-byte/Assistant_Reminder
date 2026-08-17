import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { firstValidationMessage } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";
import { validateManualScheduleRange } from "@/lib/planner/manual-schedule";
import { materializeRoutineRanges } from "@/lib/planner/routines";
import { scheduleBlockMoveSchema } from "@/lib/planner/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const { id } = await context.params;
  const parsed = scheduleBlockMoveSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const current = await prisma.scheduleBlock.findFirst({
    where: { id, userId: session.userId },
    include: { task: { select: { earliestStartAt: true, deadlineAt: true } } },
  });
  if (!current) return jsonError("Jadwal tidak ditemukan.", 404);
  if (!current.taskId || current.blockType !== "TASK") return jsonError("Rutinitas tetap tidak dapat dipindahkan dari kalender.", 409);
  if (!(["PLANNED", "ACTIVE"] as string[]).includes(current.status)) return jsonError("Jadwal yang sudah selesai tidak dapat dipindahkan.", 409);
  if (current.revision !== parsed.data.revision) return jsonError("Jadwal sudah berubah di perangkat lain. Muat ulang lalu coba lagi.", 409);

  const preference = session.user.preference;
  const validation = validateManualScheduleRange({
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
    timezone: preference?.timezone ?? "Asia/Jakarta",
    sleepStartMinute: preference?.sleepStartMinute ?? 1320,
    sleepEndMinute: preference?.sleepEndMinute ?? 360,
    earliestStartAt: current.task?.earliestStartAt,
    deadlineAt: current.task?.deadlineAt,
  });
  if (!validation.ok) return jsonError(validation.message, 409);

  const [blockConflict, routines] = await Promise.all([
    prisma.scheduleBlock.findFirst({
      where: {
        userId: session.userId,
        id: { not: id },
        status: { in: ["PLANNED", "ACTIVE"] },
        startsAt: { lt: parsed.data.endsAt },
        endsAt: { gt: parsed.data.startsAt },
      },
      select: { title: true },
    }),
    prisma.routine.findMany({ where: { userId: session.userId, active: true } }),
  ]);
  if (blockConflict) return jsonError(`Jadwal bertabrakan dengan “${blockConflict.title}”. Pilih waktu lain.`, 409);
  const routineConflict = materializeRoutineRanges(routines, { startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt })[0];
  if (routineConflict) return jsonError(`Jadwal bertabrakan dengan rutinitas “${routineConflict.title}”. Pilih waktu lain.`, 409);

  try {
    const block = await prisma.$transaction(async (tx) => {
      const updated = await tx.scheduleBlock.updateMany({
        where: { id, userId: session.userId, revision: parsed.data.revision, status: { in: ["PLANNED", "ACTIVE"] } },
        data: { startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt, reminderOffsetMinutes: parsed.data.reminderOffsetMinutes, source: "MANUAL", revision: { increment: 1 } },
      });
      if (!updated.count) throw new Error("STALE");

      const nextRevision = parsed.data.revision + 1;
      await tx.notificationJob.updateMany({
        where: { userId: session.userId, scheduleBlockId: id, status: { in: ["SCHEDULED", "PROCESSING"] } },
        data: { status: "CANCELLED" },
      });
      const offset = parsed.data.reminderOffsetMinutes;
      if (offset > 0 && parsed.data.startsAt > new Date()) {
        const intended = new Date(parsed.data.startsAt.getTime() - offset * 60000);
        await tx.notificationJob.create({
          data: {
            userId: session.userId,
            scheduleBlockId: id,
            idempotencyKey: `block:${id}:revision:${nextRevision}:offset:${offset}`,
            scheduledFor: intended > new Date() ? intended : new Date(),
          },
        });
      }
      await tx.auditEvent.create({
        data: {
          userId: session.userId,
          action: "schedule_block.moved",
          entityType: "ScheduleBlock",
          entityId: id,
          metadata: {
            before: { startsAt: current.startsAt.toISOString(), endsAt: current.endsAt.toISOString(), revision: current.revision },
            after: { startsAt: parsed.data.startsAt.toISOString(), endsAt: parsed.data.endsAt.toISOString(), reminderOffsetMinutes: offset, revision: nextRevision },
          },
        },
      });
      return tx.scheduleBlock.findUniqueOrThrow({ where: { id } });
    });
    return NextResponse.json({ ok: true, block });
  } catch (error) {
    if (error instanceof Error && error.message === "STALE") return jsonError("Jadwal sudah berubah. Muat ulang lalu coba lagi.", 409);
    return jsonError("Perubahan ditolak karena waktu tersebut baru saja terisi. Jadwal lama tetap tersimpan.", 409);
  }
}
