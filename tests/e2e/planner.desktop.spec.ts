import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
}

async function registerAndFinishOnboarding(page: Page, name: string) {
  await page.goto("/register");
  await page.getByLabel("Nama panggilan").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail("e2e.desktop"));
  await page.getByLabel("Kata sandi", { exact: true }).fill("E2ePassword123");
  await page.getByLabel("Ulangi kata sandi").fill("E2ePassword123");
  await page.getByRole("button", { name: "Buat akun" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Sesuaikan ritme minggumu." })).toBeVisible();
  await page.getByRole("button", { name: "Simpan dan buka dashboard" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: new RegExp(`Selamat datang, ${name}`, "i") })).toBeVisible();
}

test("health, readiness, dan header keamanan tersedia", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");
  expect(health.headers()["x-frame-options"]).toBe("DENY");

  const body = await health.json();
  expect(body).toMatchObject({ ok: true, status: "alive", service: "assistant-reminder" });

  const ready = await request.get("/api/health/ready");
  expect(ready.status()).toBe(200);
  const readyBody = await ready.json();
  expect(readyBody).toMatchObject({
    ok: true,
    status: "ready",
    checks: { database: { status: "up" }, redis: { status: "up" } },
  });
});

test("registrasi hingga proposal jadwal mingguan bekerja", async ({ page }) => {
  await registerAndFinishOnboarding(page, "Pengguna E2E");

  await page.getByRole("button", { name: "Tambah rencana" }).click();
  const taskDialog = page.getByRole("dialog", { name: "Tugas baru" });
  await expect(taskDialog).toBeVisible();
  await taskDialog.getByLabel("Judul").fill("Menulis laporan pengujian");
  await taskDialog.getByLabel("Durasi").fill("60");

  const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await taskDialog.getByLabel("Deadline").fill(`${deadline}T17:00`);
  await taskDialog.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByText("Tugas tersimpan.")).toBeVisible();

  await page.getByRole("button", { name: "Minggu", exact: true }).click();
  await page.getByRole("button", { name: "Minggu berikutnya" }).click();
  await page.getByRole("button", { name: "Buat proposal" }).click();

  const proposal = page.getByRole("dialog", { name: "Preview proposal" });
  await expect(proposal).toBeVisible();
  await expect(proposal.getByText("Menulis laporan pengujian")).toBeVisible();
  await proposal.getByRole("button", { name: "Konfirmasi jadwal" }).click();
  await expect(page.getByText("Jadwal diaktifkan.")).toBeVisible();
});

test("halaman publik tidak memiliki pelanggaran aksesibilitas serius", async ({ page }) => {
  for (const path of ["/login", "/register"]) {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).analyze();
    const serious = result.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious, `${path}: ${serious.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});
