import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session"; import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http"; import { firstValidationMessage } from "@/lib/auth/validation"; import { prisma } from "@/lib/db/prisma"; import { findRoutineConflict } from "@/lib/planner/routine-conflicts"; import { routineInputSchema } from "@/lib/planner/validation";
export async function GET() { const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401); const routines = await prisma.routine.findMany({ where: { userId: session.userId }, orderBy: [{ active: "desc" }, { startMinute: "asc" }] }); return NextResponse.json({ ok: true, routines }); }
export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403); const session = await currentSession(); if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const parsed = routineInputSchema.safeParse(await readJson(request)); if (!parsed.success) return jsonError(firstValidationMessage(parsed.error)); const i = parsed.data;
  const range = { startsAt: new Date(), endsAt: new Date(Date.now() + 90 * 86400000) };
  const [routines, blocks] = await Promise.all([prisma.routine.findMany({ where: { userId: session.userId, active: true } }), prisma.scheduleBlock.findMany({ where: { userId: session.userId, status: { in: ["PLANNED", "ACTIVE"] }, startsAt: { lt: range.endsAt }, endsAt: { gt: range.startsAt } }, select: { id: true, title: true, startsAt: true, endsAt: true } })]);
  const candidate = { id: "candidate", title: i.title, timezone: i.timezone, startMinute: i.startMinute, endMinute: i.endMinute, recurrence: { kind: "weekly", daysOfWeek: [...new Set(i.daysOfWeek)].sort() }, flexibility: i.flexibility };
  const conflict = findRoutineConflict(candidate, routines, blocks, range); if (conflict) return jsonError(`Rutinitas bertabrakan dengan “${conflict.conflict.title}”.`, 409);
  const routine = await prisma.routine.create({ data: { userId: session.userId, title: i.title, timezone: i.timezone, recurrence: candidate.recurrence, startMinute: i.startMinute, endMinute: i.endMinute, flexibility: i.flexibility } });
  return NextResponse.json({ ok: true, routine }, { status: 201 });
}
