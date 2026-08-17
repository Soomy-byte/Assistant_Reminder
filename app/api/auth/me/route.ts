import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth/session";

export async function GET() {
  const session = await currentSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const preference = session.user.preference;
  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      timezone: preference?.timezone ?? "Asia/Jakarta",
      onboardingCompleted: Boolean(preference?.onboardingCompletedAt),
    },
  });
}
