import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function sessionSecret() {
  const value = process.env.SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET harus diisi minimal 32 karakter.");
  }

  return value;
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueValue(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export function safeTokenEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
