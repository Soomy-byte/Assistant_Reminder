import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/http";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      email: true,
      displayName: true,
      createdAt: true,
      preference: true,
      goals: true,
      tasks: true,
      routines: true,
      routineOccurrences: true,
      scheduleBlocks: true,
      scheduleVersions: { include: { items: true } },
      brainDumps: { include: { extractions: { include: { items: true } } } },
      notificationJobs: true,
      auditEvents: true,
    },
  });

  if (!user) return jsonError("Akun tidak ditemukan.", 404);

  const exportedAt = new Date();
  const body = JSON.stringify(
    {
      format: "assistant-reminder-export-v1",
      exportedAt: exportedAt.toISOString(),
      user,
    },
    null,
    2,
  );

  return new NextResponse(body, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="assistant-reminder-${exportedAt.toISOString().slice(0, 10)}.json"`,
      "content-type": "application/json; charset=utf-8",
    },
  });
}
