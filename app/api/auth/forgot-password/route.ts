import { NextResponse } from "next/server";
import { createOpaqueToken, hashOpaqueValue } from "@/lib/auth/crypto";
import { hasSafeOrigin, jsonError, readJson, requestFingerprint } from "@/lib/auth/http";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { firstValidationMessage, forgotPasswordSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

const genericMessage = "Jika email terdaftar, instruksi reset sudah dibuat.";

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);

  const parsed = forgotPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const rateLimit = await consumeRateLimit({
    action: "forgot_password",
    identity: `${requestFingerprint(request)}:${parsed.data.email}`,
    limit: 3,
    windowMs: 30 * 60_000,
    blockMs: 30 * 60_000,
  });

  if (!rateLimit.allowed) {
    return jsonError("Terlalu banyak permintaan. Coba lagi nanti.", 429, rateLimit.retryAfter);
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  let developmentResetUrl: string | undefined;

  if (user && !user.deletedAt && user.passwordHash) {
    const token = createOpaqueToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60_000);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashOpaqueValue(token), expiresAt },
      }),
      prisma.auditEvent.create({
        data: { userId: user.id, action: "auth.password_reset_requested", entityType: "User", entityId: user.id },
      }),
    ]);

    if (process.env.NODE_ENV !== "production") {
      const url = new URL("/reset-password", request.url);
      url.searchParams.set("token", token);
      developmentResetUrl = url.toString();
    }

    // Adapter email akan dipasang saat deployment production. Token mentah tidak pernah disimpan.
  }

  return NextResponse.json({ ok: true, message: genericMessage, developmentResetUrl });
}
