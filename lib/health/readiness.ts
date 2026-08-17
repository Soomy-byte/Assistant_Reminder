export type DependencyStatus = {
  status: "up" | "down";
  latencyMs: number;
};

export type ReadinessResult = {
  ok: boolean;
  status: "ready" | "not_ready";
  checks: Record<string, DependencyStatus>;
};

type DependencyCheck = () => Promise<unknown>;

async function measure(check: DependencyCheck): Promise<DependencyStatus> {
  const startedAt = performance.now();

  try {
    await check();
    return { status: "up", latencyMs: Math.round(performance.now() - startedAt) };
  } catch {
    return { status: "down", latencyMs: Math.round(performance.now() - startedAt) };
  }
}

export async function runReadinessChecks(
  dependencies: Record<string, DependencyCheck>,
): Promise<ReadinessResult> {
  const entries = await Promise.all(
    Object.entries(dependencies).map(async ([name, check]) => [name, await measure(check)] as const),
  );
  const checks = Object.fromEntries(entries);
  const ok = Object.values(checks).every((check) => check.status === "up");

  return {
    ok,
    status: ok ? "ready" : "not_ready",
    checks,
  };
}
