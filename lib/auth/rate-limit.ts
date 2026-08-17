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
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date(); const existing = await tx.authRateLimit.findUnique({ where: { keyHash } });
        if (existing?.blockedUntil && existing.blockedUntil > now) return { allowed: false, retryAfter: Math.max(1, Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000)) };
        if (!existing || now.getTime() - existing.windowStartedAt.getTime() >= options.windowMs) { await tx.authRateLimit.upsert({ where: { keyHash }, create: { keyHash, action: options.action, attempts: 1, windowStartedAt: now }, update: { attempts: 1, windowStartedAt: now, blockedUntil: null } }); return { allowed: true, retryAfter: 0 }; }
        const next = existing.attempts + 1; const blockedUntil = next > options.limit ? new Date(now.getTime() + options.blockMs) : null; await tx.authRateLimit.update({ where: { keyHash }, data: { attempts: next, blockedUntil } }); return blockedUntil ? { allowed: false, retryAfter: Math.ceil(options.blockMs / 1000) } : { allowed: true, retryAfter: 0 };
      }, { isolationLevel: "Serializable" });
    } catch (error) { if (attempt === 1) throw error; }
  }
  throw new Error("Rate limiter transaction failed.");
}

export async function clearRateLimit(action: string, identity: string) {
  const keyHash = hashOpaqueValue(`${action}:${identity}`);
  await prisma.authRateLimit.deleteMany({ where: { keyHash } });
}
