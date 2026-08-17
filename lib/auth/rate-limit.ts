import { hashOpaqueValue } from "@/lib/auth/crypto";
import { prisma } from "@/lib/db/prisma";

type RateLimitOptions = {
  action: string;
  identity: string;
  limit: number;
  windowMs: number;
  blockMs: number;
};

export async function consumeRateLimit(options: RateLimitOptions) {
  const keyHash = hashOpaqueValue(`${options.action}:${options.identity}`);
  const now = new Date();
  const existing = await prisma.authRateLimit.findUnique({ where: { keyHash } });

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000)),
    };
  }

  const windowExpired =
    !existing || now.getTime() - existing.windowStartedAt.getTime() >= options.windowMs;

  if (windowExpired) {
    await prisma.authRateLimit.upsert({
      where: { keyHash },
      create: { keyHash, action: options.action, attempts: 1, windowStartedAt: now },
      update: { action: options.action, attempts: 1, windowStartedAt: now, blockedUntil: null },
    });
    return { allowed: true, retryAfter: 0 };
  }

  const nextAttempts = existing.attempts + 1;
  const blockedUntil =
    nextAttempts > options.limit ? new Date(now.getTime() + options.blockMs) : null;

  await prisma.authRateLimit.update({
    where: { keyHash },
    data: { attempts: nextAttempts, blockedUntil },
  });

  return blockedUntil
    ? { allowed: false, retryAfter: Math.ceil(options.blockMs / 1000) }
    : { allowed: true, retryAfter: 0 };
}

export async function clearRateLimit(action: string, identity: string) {
  const keyHash = hashOpaqueValue(`${action}:${identity}`);
  await prisma.authRateLimit.deleteMany({ where: { keyHash } });
}
