# Assistant Reminder

Assistant Reminder adalah aplikasi perencanaan personal harian, mingguan, dan bulanan. Pengguna menyusun target, tugas, dan rutinitas; scheduler kemudian membuat proposal jadwal realistis yang harus dikonfirmasi sebelum menjadi jadwal aktif.

## Status proyek

Versi source: **v0.5.1**.

- Berjalan lokal sebagai modular monolith Next.js dengan worker notifikasi terpisah.
- Source sudah disiapkan untuk Git/GitHub dan tidak menyertakan cache, hasil build, laporan tes, atau adapter deployment lama.
- Deployment Vercel belum dinyatakan production-ready. Database terkelola, runtime worker, secret production, backup, monitoring, dan pengujian perangkat fisik masih harus disiapkan.

## Fitur utama

- Akun, sesi aman, onboarding, dan preferensi zona waktu.
- CRUD target bulanan, tugas, dan rutinitas mingguan.
- Agenda harian, kalender mingguan, serta ringkasan bulanan.
- Scheduler berdasarkan deadline, prioritas, hari aktif, jam tidur, fokus, jeda, dan pemecahan tugas.
- Preview proposal, konfirmasi, reschedule, snapshot, dan undo.
- Brain Dump dengan parser lokal; adapter OpenAI bersifat opsional.
- Kalender desktop dengan drag-and-drop dan dialog alternatif yang ramah mobile/keyboard.
- PWA, cache agenda terakhir, mode offline baca-saja, serta Web Push best effort.
- Health/readiness endpoint, unit test, typecheck, lint, production build, dan Playwright E2E.
- Ekspor data dan penghapusan akun dengan verifikasi kata sandi.

## Teknologi

| Bagian | Teknologi | Peran |
| --- | --- | --- |
| Web dan API | Next.js, React, TypeScript | Halaman, komponen UI, dan route API dalam satu codebase |
| Validasi | Zod | Memeriksa data pada batas API sebelum diproses |
| Database | PostgreSQL, Prisma | Menyimpan data utama, relasi, transaksi, dan migration |
| Antrean | Redis, BullMQ | Menjadwalkan job reminder dengan delay dan retry |
| Notifikasi | Web Push, service worker | Mengirim dan menampilkan reminder pada perangkat |
| Pengujian | Node test runner, Playwright, Axe | Unit test, E2E desktop/mobile, dan aksesibilitas |

## Struktur repository

```text
app/                  Halaman Next.js dan route API
components/           Komponen UI berdasarkan domain
lib/                  Aturan bisnis, autentikasi, database, dan scheduler
prisma/               Schema serta riwayat migration PostgreSQL
public/               Favicon dan service worker PWA
scripts/              Otomasi development, test, dan pembersihan
tests/e2e/             Skenario Playwright desktop dan mobile
worker/                Proses background pengirim notifikasi
docs/                  PRD, arsitektur, setup, panduan, dan release notes
```

Folder seperti `node_modules`, `.next`, `app/generated/prisma`, `.sites-runtime`, `playwright-report`, dan `test-results` tidak disimpan di Git karena semuanya dapat dibuat ulang.

## Menjalankan di Windows dan VS Code

Prasyarat: Node.js 22.13+, Docker Desktop, Git, dan VS Code.

```powershell
npm.cmd install
Copy-Item .env.example .env
docker compose up -d postgres redis
npm.cmd run db:prisma:generate
npm.cmd run db:migrate
npm.cmd run test:unit
npm.cmd run dev
```

Isi `SESSION_SECRET` di `.env` dengan nilai acak minimal 32 karakter. Setelah server hidup, buka `http://localhost:3000`.

Nama database internal `weekly_assistant` dipertahankan sementara untuk kompatibilitas data lokal versi lama. Nama ini bukan branding yang ditampilkan kepada pengguna; menggantinya memerlukan migration data tersendiri.

## Notifikasi Web Push

Buat pasangan kunci VAPID satu kali:

```powershell
npm.cmd run notifications:keys
```

Salin hasilnya ke `.env`, lalu jalankan worker pada terminal VS Code kedua:

```powershell
npm.cmd run worker:notifications
```

Reminder background memerlukan HTTPS serta proses web, PostgreSQL, Redis, dan worker yang selalu aktif. Web Push bersifat best effort ketika perangkat, jaringan, atau layanan push sedang offline.

## Pemeriksaan kualitas

Pemeriksaan lengkap:

```powershell
npm.cmd test
```

Perintah tersebut menjalankan unit test, TypeScript typecheck, ESLint, dan production build secara berurutan. E2E dijalankan terpisah karena membutuhkan Docker serta browser Playwright:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Bersihkan hasil build dan laporan tes yang dapat dibuat ulang:

```powershell
npm.cmd run clean
```

Script `clean` tidak menghapus source code, `.env`, `node_modules`, atau data volume Docker.

## Dokumentasi

Mulai dari [`docs/README.md`](docs/README.md):

- setup Windows/VS Code;
- arsitektur dan alur data;
- panduan memahami setiap komponen;
- pengujian dan kesiapan deployment;
- PRD serta release notes.

## AI opsional

Default `AI_PROVIDER="mock"` memakai parser lokal dan tidak mengirim Brain Dump ke layanan eksternal. Jika adapter OpenAI diaktifkan, hasilnya tetap divalidasi dan harus diperiksa pengguna sebelum disimpan sebagai tugas.

## Batas versi saat ini

- Aplikasi lokal belum sama dengan production yang selalu aktif.
- Deployment Vercel memerlukan keputusan runtime worker dan layanan PostgreSQL/Redis terkelola.
- Pengiriman email reset password, observability lanjutan, backup/restore production, dokumen legal, load test, dan uji perangkat fisik masih termasuk fase hardening.
