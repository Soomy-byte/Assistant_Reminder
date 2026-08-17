import { NextResponse } from "next/server";
import { z } from "zod";
import { currentSession } from "@/lib/auth/session";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { firstValidationMessage } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(4096),
  keys: z.object({ p256dh: z.string().min(20).max(2048), auth: z.string().min(8).max(512) }),
});

export async function GET() {
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const activeDevices = await prisma.notificationSubscription.count({ where: { userId: session.userId, active: true } });
  return NextResponse.json({ ok: true, publicKey: process.env.WEB_PUSH_PUBLIC_KEY ?? "", activeDevices });
}

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const parsed = subscriptionSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const existing = await prisma.notificationSubscription.findUnique({ where: { endpoint: parsed.data.endpoint } });
  if (existing && existing.userId !== session.userId) return jsonError("Perangkat ini sudah terhubung ke akun lain.", 409);
  if (!existing) {
    const activeDevices = await prisma.notificationSubscription.count({ where: { userId: session.userId, active: true } });
    if (activeDevices >= 10) return jsonError("Maksimum 10 perangkat notifikasi per akun.", 409);
  }

  const subscription = existing
    ? await prisma.notificationSubscription.update({ where: { id: existing.id }, data: { p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent: request.headers.get("user-agent")?.slice(0, 500), active: true, lastSeenAt: new Date() } })
    : await prisma.notificationSubscription.create({ data: { userId: session.userId, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent: request.headers.get("user-agent")?.slice(0, 500) } });
  return NextResponse.json({ ok: true, subscription: { id: subscription.id, active: subscription.active } });
}

export async function DELETE(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);
  const parsed = subscriptionSchema.pick({ endpoint: true }).safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));
  await prisma.notificationSubscription.updateMany({ where: { userId: session.userId, endpoint: parsed.data.endpoint }, data: { active: false, lastSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
