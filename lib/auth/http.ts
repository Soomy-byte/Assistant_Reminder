import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400, retryAfter?: number) {
  const response = NextResponse.json({ ok: false, message }, { status });

  if (retryAfter) {
    response.headers.set("Retry-After", String(retryAfter));
  }

  return response;
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function requestFingerprint(request: Request) {
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwarded = trustProxy ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : null;
  const address = forwarded || (trustProxy ? request.headers.get("x-real-ip") : null) || "direct";
  return address.slice(0, 80);
}

export function hasSafeOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const configured = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : null;
    if (configured) return originUrl.origin === configured;
    const trustProxy = process.env.TRUST_PROXY === "true";
    const forwardedHost = trustProxy ? request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() : null;
    const forwardedProtocol = trustProxy ? request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() : null;
    const expected = forwardedHost ? `${forwardedProtocol || requestUrl.protocol.replace(":", "")}://${forwardedHost}` : requestUrl.origin;
    return originUrl.origin === expected;
  } catch {
    return false;
  }
}
