import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { createOpaqueToken, hashOpaqueValue } from "@/lib/auth/crypto";
import { prisma } from "@/lib/db/prisma";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, tokenHash: hashOpaqueValue(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return expiresAt;
}

export async function currentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashOpaqueValue(token) },
    include: { user: { include: { preference: true } } },
  });

  if (!session || session.expiresAt <= new Date() || session.user.deletedAt) {
    return null;
  }

  return session;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashOpaqueValue(token) } });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
