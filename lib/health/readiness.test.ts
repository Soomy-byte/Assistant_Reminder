import assert from "node:assert/strict";
import test from "node:test";
import { runReadinessChecks } from "./readiness";

test("readiness siap ketika semua dependency dapat dijangkau", async () => {
  const result = await runReadinessChecks({
    database: async () => true,
    redis: async () => "PONG",
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, "ready");
  assert.equal(result.checks.database.status, "up");
  assert.equal(result.checks.redis.status, "up");
});

test("readiness gagal tanpa membocorkan pesan internal dependency", async () => {
  const result = await runReadinessChecks({
    database: async () => {
      throw new Error("postgresql://user:secret@database/internal");
    },
    redis: async () => "PONG",
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "not_ready");
  assert.deepEqual(result.checks.database.status, "down");
  assert.equal(JSON.stringify(result).includes("secret"), false);
});
