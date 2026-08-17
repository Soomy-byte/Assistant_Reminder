import { NextResponse } from "next/server";
import { hashOpaqueValue } from "@/lib/auth/crypto";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { hashPassword } from "@/lib/auth/password";
import { firstValidationMessage, resetPasswordSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);

  const parsed = resetPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashOpaqueValue(parsed.data.token) },
  });

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return jsonError("Tautan reset tidak valid atau sudah kedaluwarsa.", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  const claimed = await prisma.$transaction(async (transaction) => {
    const claim = await transaction.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });

    if (claim.count !== 1) return false;

    await transaction.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await transaction.passwordResetToken.updateMany({
      where: { userId: record.userId, id: { not: record.id }, usedAt: null },
      data: { usedAt: now },
    });
    await transaction.session.deleteMany({ where: { userId: record.userId } });
    await transaction.auditEvent.create({
      data: { userId: record.userId, action: "auth.password_reset_completed", entityType: "User", entityId: record.userId },
    });
    return true;
  });

  if (!claimed) return jsonError("Tautan reset sudah digunakan.", 400);

  return NextResponse.json({ ok: true, message: "Kata sandi diperbarui. Silakan masuk kembali." });
}
