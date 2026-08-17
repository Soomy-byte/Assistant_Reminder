import { NextResponse } from "next/server";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { currentSession } from "@/lib/auth/session";
import { firstValidationMessage, profileSchema, timeToMinute } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const data = parsed.data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.userId }, data: { displayName: data.displayName } }),
    prisma.userPreference.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        timezone: data.timezone,
        clockFormat: data.clockFormat,
        weekStartsOn: data.weekStartsOn,
        activeDays: [...new Set(data.activeDays)].sort(),
        sleepStartMinute: timeToMinute(data.sleepStart),
        sleepEndMinute: timeToMinute(data.sleepEnd),
        maximumFocusMinutes: data.maximumFocusMinutes,
        minimumBreakMinutes: data.minimumBreakMinutes,
        defaultReminderMinutes: data.defaultReminderMinutes,
        onboardingCompletedAt: new Date(),
      },
      update: {
        timezone: data.timezone,
        clockFormat: data.clockFormat,
        weekStartsOn: data.weekStartsOn,
        activeDays: [...new Set(data.activeDays)].sort(),
        sleepStartMinute: timeToMinute(data.sleepStart),
        sleepEndMinute: timeToMinute(data.sleepEnd),
        maximumFocusMinutes: data.maximumFocusMinutes,
        minimumBreakMinutes: data.minimumBreakMinutes,
        defaultReminderMinutes: data.defaultReminderMinutes,
        onboardingCompletedAt: new Date(),
      },
    }),
    prisma.auditEvent.create({
      data: { userId: session.userId, action: "onboarding.completed", entityType: "User", entityId: session.userId },
    }),
  ]);

  return NextResponse.json({ ok: true, next: "/" });
}
