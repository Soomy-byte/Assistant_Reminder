import { NextResponse } from "next/server"; import { currentSession } from "@/lib/auth/session"; import { jsonError } from "@/lib/auth/http"; import { firstValidationMessage } from "@/lib/auth/validation"; import { prisma } from "@/lib/db/prisma"; import { materializeRoutineRanges } from "@/lib/planner/routines"; import { rangeQuerySchema } from "@/lib/planner/validation";
export async function GET(request: Request) {
  const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401); const url = new URL(request.url); const parsed = rangeQuerySchema.safeParse({ from: url.searchParams.get("from"), to: url.searchParams.get("to") }); if (!parsed.success) return jsonError(firstValidationMessage(parsed.error)); const range = { startsAt: new Date(parsed.data.from), endsAt: new Date(parsed.data.to) }; if (range.endsAt.getTime() - range.startsAt.getTime() > 75 * 86400000) return jsonError("Rentang kalender maksimal 75 hari.");
  const [tasks, routines, blocks, goals] = await Promise.all([
    prisma.task.findMany({ where: { userId: session.userId, deletedAt: null }, include: { goal: { select: { id: true, title: true } }, scheduleBlocks: { where: { status: { in: ["PLANNED", "ACTIVE"] }, startsAt: { lt: range.endsAt }, endsAt: { gt: range.startsAt } }, orderBy: { startsAt: "asc" } } }, orderBy: [{ status: "asc" }, { deadlineAt: "asc" }] }),
    prisma.routine.findMany({ where: { userId: session.userId, active: true }, orderBy: { startMinute: "asc" } }),
    prisma.scheduleBlock.findMany({ where: { userId: session.userId, status: { in: ["PLANNED", "ACTIVE", "COMPLETED", "MISSED"] }, startsAt: { lt: range.endsAt }, endsAt: { gt: range.startsAt } }, orderBy: { startsAt: "asc" } }),
    prisma.goal.findMany({ where: { userId: session.userId }, include: { tasks: { where: { deletedAt: null }, select: { id: true, title: true, status: true } } }, orderBy: { monthStart: "desc" } }),
  ]);
  return NextResponse.json(
    { ok: true, planner: { timezone: session.user.preference?.timezone ?? "Asia/Jakarta", preferences: session.user.preference, tasks, routines, blocks, routineOccurrences: materializeRoutineRanges(routines, range), goals } },
    { headers: { "cache-control": "private, no-store" } },
  );
}
