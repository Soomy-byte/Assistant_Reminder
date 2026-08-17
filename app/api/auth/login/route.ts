import { NextResponse } from "next/server";
import { hasSafeOrigin, jsonError, readJson, requestFingerprint } from "@/lib/auth/http";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { clearRateLimit, consumeRateLimit } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { firstValidationMessage, loginSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);

  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const identity = `${requestFingerprint(request)}:${parsed.data.email}`;
  const rateLimit = await consumeRateLimit({
    action: "login",
    identity,
    limit: 5,
    windowMs: 15 * 60_000,
    blockMs: 15 * 60_000,
  });

  if (!rateLimit.allowed) {
    return jsonError("Terlalu banyak percobaan login. Coba lagi nanti.", 429, rateLimit.retryAfter);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { preference: true },
  });

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  const valid = Boolean(user?.passwordHash) && !user?.deletedAt && passwordMatches;

  if (!valid || !user) return jsonError("Email atau kata sandi tidak cocok.", 401);

  await Promise.all([
    clearRateLimit("login", identity),
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.auditEvent.create({ data: { userId: user.id, action: "auth.login_succeeded", entityType: "User", entityId: user.id } }),
  ]);
  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    next: user.preference?.onboardingCompletedAt ? "/" : "/onboarding",
  });
}
