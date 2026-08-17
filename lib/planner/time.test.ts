import assert from "node:assert/strict"; import test from "node:test"; import { localDateTimeToUtc, zonedParts } from "./time";
test("converts Jakarta wall clock to UTC", () => { const result = localDateTimeToUtc({ year: 2026, month: 8, day: 17, hour: 8, minute: 0 }, "Asia/Jakarta"); assert.equal(result.toISOString(), "2026-08-17T01:00:00.000Z"); assert.equal(zonedParts(result, "Asia/Jakarta").hour, 8); });
test("rejects nonexistent DST time", () => { assert.throws(() => localDateTimeToUtc({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, "America/New_York")); });
