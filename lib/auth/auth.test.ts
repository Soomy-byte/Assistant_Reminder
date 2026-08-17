import assert from "node:assert/strict";
import test from "node:test";
import { hashOpaqueValue } from "./crypto";
import { hashPassword, verifyPassword } from "./password";
import { minuteToTime, registerSchema, timeToMinute } from "./validation";

process.env.SESSION_SECRET = "test-secret-that-is-longer-than-thirty-two-characters";

test("registration normalizes a valid email", () => {
  const result = registerSchema.parse({
    displayName: "Ayu Pratama",
    email: "  AYU@EXAMPLE.COM ",
    password: "AmanBanget123",
  });

  assert.equal(result.email, "ayu@example.com");
});

test("weak passwords are rejected", () => {
  const result = registerSchema.safeParse({
    displayName: "Ayu",
    email: "ayu@example.com",
    password: "password",
  });

  assert.equal(result.success, false);
});

test("local time conversion is reversible", () => {
  assert.equal(timeToMinute("22:30"), 1350);
  assert.equal(minuteToTime(1350), "22:30");
});

test("opaque values are hashed deterministically without storing the raw token", () => {
  const token = "a-private-one-time-token";
  const first = hashOpaqueValue(token);
  const second = hashOpaqueValue(token);

  assert.equal(first, second);
  assert.notEqual(first, token);
  assert.equal(first.length, 64);
});

test("password hashes verify the correct password only", async () => {
  const hash = await hashPassword("AmanBanget123");

  assert.equal(await verifyPassword("AmanBanget123", hash), true);
  assert.equal(await verifyPassword("BukanPassword123", hash), false);
  assert.notEqual(hash, "AmanBanget123");
});
