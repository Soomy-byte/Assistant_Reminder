# AI Weekly Assistant

AI Weekly Assistant mengubah Brain Dump pengguna menjadi tugas terstruktur dan jadwal mingguan yang realistis. AI memahami input, sedangkan mesin aturan deterministik memvalidasi kapasitas, deadline, rutinitas tetap, dan benturan waktu.

## Baseline teknologi

- Next.js + React + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ untuk worker notifikasi pada fase berikutnya
- Web Push + service worker untuk PWA pada fase berikutnya
- Adapter AI server-side untuk ekstraksi Brain Dump

## Status implementasi

Tersedia saat ini:

- Registrasi, login, logout, dan sesi PostgreSQL.
- Hash kata sandi bcrypt dan cookie `HttpOnly`.
- Pembatasan percobaan login berbasis database.
- Reset kata sandi dengan token satu-kali berumur 30 menit.
- Onboarding serta pengaturan profil dan zona waktu.
- Dashboard Hari Ini yang responsif.
- Agenda desktop dan mobile.
- Pembaruan progres interaktif.
- Modal Brain Dump dan alur draf.
- Model data PostgreSQL.
- Migrasi awal dengan constraint anti-overlap.
- Mesin penjadwalan deterministik dan unit test dasar.

Belum diaktifkan pada runtime production:

- Koneksi PostgreSQL managed.
- CRUD tugas dan rutinitas persisten.
- Integrasi AI provider.
- Queue notifikasi dan Web Push.

## Menjalankan secara lokal

Prasyarat:

- Node.js 22.13 atau lebih baru.
- PostgreSQL.
- Redis diperlukan setelah modul notifikasi diaktifkan.

Langkah dasar:

1. Salin `.env.example` menjadi `.env`.
2. Isi `DATABASE_URL` dan `SESSION_SECRET`.
3. Jalankan `npm install` (Prisma Client dibuat otomatis).
4. Terapkan migrasi PostgreSQL.
5. Jalankan server pengembangan.

## Perintah pemeriksaan

- `npm run lint` — memeriksa source.
- `npm run test:unit` — menjalankan pengujian auth dan mesin penjadwalan.
- `npm run build` — membangun dan memvalidasi artifact aplikasi.
- `npm test` — menjalankan unit test, build, dan pemeriksaan HTML.

## Struktur utama

- `app/` — antarmuka dan route aplikasi.
- `lib/scheduling/` — mesin penjadwalan deterministik.
- `prisma/schema.prisma` — model data PostgreSQL.
- `prisma/migrations/` — migrasi dan constraint database.
- `docs/ARCHITECTURE.md` — keputusan arsitektur dan invariant.
- `docs/PHASE_1_IDENTITY.md` — cakupan dan hasil pemeriksaan Fase 1.

## Aturan waktu

- Instant disimpan sebagai `timestamptz` dalam UTC.
- Zona waktu IANA pengguna disimpan terpisah.
- Blok memakai rentang setengah terbuka `[mulai, selesai)`.
- PostgreSQL menolak blok `PLANNED` atau `ACTIVE` yang tumpang tindih untuk pengguna yang sama.

PRD produk `PRD_AI_Weekly_Assistant_v2.0.md` disertakan bersama paket rilis source.
