import { NextResponse } from "next/server";
import { hasSafeOrigin, jsonError } from "@/lib/auth/http";
import { currentSession, destroyCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);

  const session = await currentSession();
  await destroyCurrentSession();

  if (session) {
    await prisma.auditEvent.create({
      data: { userId: session.userId, action: "auth.logged_out", entityType: "Session", entityId: session.id },
    });
  }

  return NextResponse.json({ ok: true });
}
