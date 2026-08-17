import { NextResponse } from "next/server";
import { hasSafeOrigin, jsonError, readJson } from "@/lib/auth/http";
import { currentSession } from "@/lib/auth/session";
import { firstValidationMessage, minuteToTime, profileSchema, timeToMinute } from "@/lib/auth/validation";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const preference = session.user.preference;
  return NextResponse.json({
    ok: true,
    profile: {
      email: session.user.email,
      displayName: session.user.displayName ?? "",
      timezone: preference?.timezone ?? "Asia/Jakarta",
      clockFormat: preference?.clockFormat ?? 24,
      weekStartsOn: preference?.weekStartsOn ?? 1,
      activeDays: preference?.activeDays ?? [1, 2, 3, 4, 5],
      sleepStart: minuteToTime(preference?.sleepStartMinute ?? 1320),
      sleepEnd: minuteToTime(preference?.sleepEndMinute ?? 360),
      maximumFocusMinutes: preference?.maximumFocusMinutes ?? 120,
      minimumBreakMinutes: preference?.minimumBreakMinutes ?? 15,
      defaultReminderMinutes: preference?.defaultReminderMinutes ?? 15,
    },
  });
}

export async function PUT(request: Request) {
  if (!hasSafeOrigin(request)) return jsonError("Origin permintaan tidak valid.", 403);
  const session = await currentSession();
  if (!session) return jsonError("Silakan masuk terlebih dahulu.", 401);

  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstValidationMessage(parsed.error));

  const data = parsed.data;
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.userId }, data: { displayName: data.displayName } }),
    prisma.userPreference.update({
      where: { userId: session.userId },
      data: {
        timezone: data.timezone,
        clockFormat: data.clockFormat,
        weekStartsOn: data.weekStartsOn,
        activeDays: [...new Set(data.activeDays)].sort(),
        sleepStartMinute: timeToMinute(data.sleepStart),
        sleepEndMinute: timeToMinute(data.sleepEnd),
        maximumFocusMinutes: data.maximumFocusMinutes,
        minimumBreakMinutes: data.minimumBreakMinutes,
        defaultReminderMinutes: data.defaultReminderMinutes,
      },
    }),
    prisma.auditEvent.create({
      data: { userId: session.userId, action: "profile.updated", entityType: "User", entityId: session.userId },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Preferensi berhasil disimpan." });
}
