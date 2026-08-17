import Redis from "ioredis";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runReadinessChecks } from "@/lib/health/readiness";

export const dynamic = "force-dynamic";

async function pingRedis() {
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    connectTimeout: 1_500,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 0,
  });

  try {
    await redis.connect();
    const response = await redis.ping();
    if (response !== "PONG") throw new Error("Redis tidak mengembalikan PONG.");
  } finally {
    redis.disconnect();
  }
}

export async function GET() {
  const result = await runReadinessChecks({
    database: () => prisma.$queryRaw`SELECT 1`,
    redis: pingRedis,
  });

  return NextResponse.json(
    { ...result, timestamp: new Date().toISOString() },
    {
      status: result.ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
