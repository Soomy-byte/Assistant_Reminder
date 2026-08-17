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
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "local";
  return address.slice(0, 80);
}

export function hasSafeOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const expectedHost = forwardedHost || requestUrl.host;
    return originUrl.host === expectedHost;
  } catch {
    return false;
  }
}
