import { expect, test } from "@playwright/test";

test("alur awal dan dialog tugas nyaman digunakan pada layar handphone", async ({ page }) => {
  const email = `e2e.mobile.${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Nama panggilan").fill("Pengguna HP");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill("E2ePassword123");
  await page.getByLabel("Ulangi kata sandi").fill("E2ePassword123");
  await page.getByRole("button", { name: "Buat akun" }).click();
  await page.getByRole("button", { name: "Simpan dan buka dashboard" }).click();

  await expect(page.getByRole("heading", { name: /Selamat datang, Pengguna HP/i })).toBeVisible();
  const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(viewportFits).toBe(true);

  await page.getByRole("button", { name: "Tambah rencana" }).click();
  const dialog = page.getByRole("dialog", { name: "Tugas baru" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Judul")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Tutup dialog Tugas baru" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
