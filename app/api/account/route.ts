import { z } from "zod";
import { NextResponse } from "next/server";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { destroyCurrentSession, currentSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
  confirmation: z.literal("HAPUS"),
});

export async function DELETE(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const parsed = deleteAccountSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError("Ketik HAPUS dan masukkan kata sandi yang benar.");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return jsonError("Kata sandi tidak benar.", 403);
  }

  await prisma.$transaction([
    prisma.auditEvent.deleteMany({ where: { userId: session.userId } }),
    prisma.user.delete({ where: { id: session.userId } }),
  ]);
  await destroyCurrentSession();

  return NextResponse.json({ ok: true, next: "/register" });
}
