# Arsitektur Assistant Reminder v0.5.1

## Gaya arsitektur

V1 memakai **modular monolith**: UI, route API, aturan domain, dan akses database berada dalam satu repository Next.js. Proses background notifikasi berada dalam codebase yang sama, tetapi dijalankan sebagai proses worker terpisah.

Pendekatan ini menjaga deployment dan pengembangan tetap sederhana tanpa mencampurkan semua tanggung jawab dalam komponen UI.

## Komponen

| Komponen | Lokasi | Tanggung jawab |
| --- | --- | --- |
| Next.js UI | `app/`, `components/` | Halaman, form, dashboard, kalender, dan state antarmuka |
| Route API | `app/api/` | Trust boundary HTTP: autentikasi, validasi, orkestrasi service, dan respons |
| Identity | `lib/auth/` | Password hashing, sesi, cookie, origin check, validasi, dan rate limit |
| Planner | `lib/planner/` | Aturan rutinitas, waktu, konflik, dan perubahan jadwal manual |
| Scheduler | `lib/scheduling/` | Algoritme deterministik untuk membentuk proposal jadwal |
| AI adapter | `lib/ai/` | Ekstraksi Brain Dump lokal atau provider eksternal yang tervalidasi |
| Data access | `lib/db/`, `prisma/` | Prisma Client, schema, transaction, constraint, dan migration PostgreSQL |
| Queue dan worker | `worker/` | Sinkronisasi job BullMQ dan pengiriman Web Push dengan retry |
| PWA | `app/manifest.ts`, `public/sw.js`, `components/pwa/` | Instalasi, cache shell, offline baca-saja, dan penerimaan push |

## Alur utama

```text
Target → Tugas → Scheduler → Proposal → Konfirmasi → ScheduleBlock → Reminder
```

1. Pengguna membuat target, tugas, dan rutinitas melalui UI.
2. Route API memverifikasi sesi serta memvalidasi payload.
3. Scheduler membaca batasan pengguna dan mencari slot tanpa overlap.
4. Hasil disimpan sebagai proposal, bukan langsung menjadi jadwal aktif.
5. Setelah pengguna mengonfirmasi, transaction membuat `ScheduleBlock` dan `NotificationJob`.
6. Worker menyinkronkan pekerjaan reminder ke Redis/BullMQ.
7. Web Push diterima service worker dan ditampilkan pada perangkat.

## Sumber kebenaran

- PostgreSQL adalah sumber kebenaran data pengguna dan status reminder.
- Redis adalah penyimpanan antrean sementara, bukan database utama.
- Browser menyimpan cache agenda terakhir hanya untuk pengalaman offline baca-saja.
- Scheduler menghasilkan proposal; database baru berubah setelah konfirmasi.

## Waktu dan konsistensi

- Instant disimpan sebagai UTC `timestamptz`.
- Rutinitas menggunakan wall clock dan zona waktu IANA pengguna.
- Rentang waktu berbentuk setengah terbuka `[mulai, selesai)`.
- Optimistic revision mendeteksi perubahan dari perangkat lain.
- PostgreSQL exclusion constraint menjadi pagar terakhir terhadap overlap jadwal aktif.
- Perubahan blok, pembatalan reminder lama, reminder baru, dan audit event dilakukan dalam transaction.

## Keamanan

- Semua query domain mendapatkan `userId` dari sesi server, bukan dari input pengguna.
- Cookie sesi menggunakan `HttpOnly` dan `SameSite=Lax`.
- Mutasi memeriksa origin; proxy header hanya dipercaya ketika `TRUST_PROXY=true`.
- Input API divalidasi menggunakan Zod.
- API key dan private key hanya tersedia pada server melalui environment variable.
- Respons readiness tidak mengirim credential atau pesan internal dependency.

## Health dan readiness

- `GET /api/health` membuktikan proses Next.js hidup.
- `GET /api/health/ready` menguji koneksi PostgreSQL dan Redis.
- HTTP 503 berarti server web hidup, tetapi belum siap melayani operasi data secara penuh.

## Batas deployment Vercel

Next.js dapat dibangun untuk Vercel, tetapi `worker/notifications.ts` adalah proses panjang yang tidak boleh diasumsikan selalu hidup pada runtime serverless. Sebelum production, proyek perlu menentukan runtime worker yang selalu aktif atau mengubah mekanisme pemrosesan reminder menjadi pekerjaan terjadwal yang kompatibel dengan platform.

Database PostgreSQL dan Redis lokal dari Docker juga harus diganti dengan layanan terkelola yang memiliki TLS, credential production, backup, batas koneksi, serta monitoring. Keputusan ini termasuk fase deployment berikutnya dan tidak mengubah keputusan PRD bahwa PostgreSQL tetap menjadi sumber data utama.

## Kompatibilitas nama database lokal

Identifier internal `weekly_assistant`, `weekly_user`, dan volume PostgreSQL lama dipertahankan agar data development pengguna lama tidak terputus. Branding yang terlihat pengguna tetap **Assistant Reminder**. Rename database akan dilakukan melalui prosedur backup, restore, dan perubahan connection string terpisah—bukan melalui perapian repository.
