import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { hasSafeOrigin, jsonError, readJson, requestFingerprint } from "@/lib/auth/http";
import { hashPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { firstValidationMessage, registerSchema } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);

  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const rateLimit = await consumeRateLimit({
    action: "register",
    identity: requestFingerprint(request),
    limit: 5,
    windowMs: 15 * 60_000,
    blockMs: 15 * 60_000,
  });

  if (!rateLimit.allowed) {
    return jsonError("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429, rateLimit.retryAfter);
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return jsonError("Email sudah digunakan.", 409);

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      passwordHash,
      preference: { create: {} },
      auditEvents: { create: { action: "auth.registered", entityType: "User" } },
    },
    select: { id: true },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true, next: "/onboarding" }, { status: 201 });
}
