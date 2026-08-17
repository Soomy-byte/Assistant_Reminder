# Pengujian dan Kesiapan Deployment v0.5.1

## Status lingkungan

| Lingkungan | Tujuan | Status |
| --- | --- | --- |
| Local | Mengembangkan fitur dengan data milik developer | Tersedia melalui Next.js + Docker PostgreSQL/Redis |
| Test | Menguji otomatis tanpa menyentuh data development | Tersedia melalui Compose test + Playwright |
| Staging | Meniru production dengan data non-production | Belum disiapkan |
| Production | Melayani pengguna nyata dengan backup dan monitoring | Belum disiapkan |

Repository yang dapat dibangun belum otomatis berarti production-ready. Production juga membutuhkan layanan data yang selalu aktif, secret aman, migration terkontrol, worker reminder, observability, backup/restore, dan prosedur rollback.

## Fungsi teknologi

| Teknologi | Masalah yang diselesaikan | Cara digunakan di proyek |
| --- | --- | --- |
| Node.js | Menjalankan JavaScript di luar browser | Menjalankan Next.js, script, test, dan worker |
| npm | Mengelola dependency serta perintah proyek | Membaca `package.json` dan memasang versi dari `package-lock.json` |
| Next.js | Menyatukan UI React dan API server | Route halaman berada di `app/`; handler HTTP berada di `app/api/` |
| TypeScript | Menemukan ketidaksesuaian tipe sebelum runtime | `tsc --noEmit` memeriksa source tanpa membuat build artifact |
| PostgreSQL | Menyimpan data relasional secara persisten | Menyimpan akun, tugas, rutinitas, jadwal, proposal, snapshot, dan reminder |
| Prisma | Menghubungkan model TypeScript dan PostgreSQL | Schema mendefinisikan model; migration mengubah struktur database |
| Docker Compose | Membuat dependency lokal dapat diulang | Menyalakan PostgreSQL dan Redis dengan port, volume, dan health check |
| Redis + BullMQ | Menahan pekerjaan reminder sampai waktunya tiba | API membuat status job; worker menjadwalkan, retry, dan mengirim push |
| Service worker | Menjalankan fitur PWA di luar lifecycle halaman | Menyimpan shell statis dan menerima event Web Push |
| Playwright + Axe | Menguji alur pengguna dan aksesibilitas | Membuka browser desktop/mobile, mengisi form, dan memeriksa hasil UI |

## Quality gate lokal

Pastikan terminal berada di folder yang memiliki `package.json`, kemudian jalankan:

```powershell
npm.cmd install
npm.cmd test
```

`npm.cmd test` menjalankan:

1. unit test;
2. TypeScript typecheck;
3. ESLint;
4. production build Next.js.

Proses dinyatakan lulus jika exit code `0`, tidak ada test gagal, tidak ada error type/lint, dan Next.js menampilkan hasil build route.

## E2E terisolasi

Pasang Chromium Playwright satu kali:

```powershell
npx.cmd playwright install chromium
```

Kemudian:

```powershell
npm.cmd run test:e2e
```

Script E2E:

1. membuat `.env.test` dari contoh jika belum ada;
2. menyalakan PostgreSQL tes pada port `5433`;
3. menyalakan Redis tes pada port `6380`;
4. menjalankan migration tes;
5. menyalakan Next.js tes pada port `3100`;
6. menjalankan skenario desktop dan mobile;
7. menyimpan report/trace ketika diperlukan.

Data test menggunakan penyimpanan sementara sehingga tidak mencampuri database development pada port `5432`.

Bersihkan container test:

```powershell
npm.cmd run test:e2e:clean
```

Bersihkan build, generated client, cache, dan laporan lokal:

```powershell
npm.cmd run clean
```

Setelah `clean`, `npm.cmd install` atau `npm.cmd run db:prisma:generate` akan membuat kembali Prisma Client; `npm.cmd run build` akan membuat kembali `.next`.

## Health check lokal

Ketika aplikasi dan dependency hidup:

- `http://localhost:3000/api/health` harus mengembalikan status proses web hidup.
- `http://localhost:3000/api/health/ready` harus mengembalikan HTTP 200 serta status PostgreSQL/Redis siap.

HTTP 503 dari readiness berarti Next.js hidup, tetapi salah satu dependency belum dapat digunakan.

## Pipeline menuju Vercel

Urutan delivery yang direncanakan:

1. Git push ke branch fitur.
2. Unit test, typecheck, lint, dan build.
3. Validasi migration terhadap database staging.
4. Deploy preview/staging.
5. Smoke test autentikasi, planner, database, dan PWA.
6. Verifikasi worker reminder pada runtime yang selalu aktif.
7. Persetujuan deployment production.
8. Migration production dengan backup/restore point.
9. Deploy production dan post-deploy verification.
10. Pantau error, latency, antrean gagal, dan pengiriman reminder.

## Gap sebelum import ke Vercel

- Sediakan PostgreSQL production terkelola dan connection pooling yang kompatibel dengan runtime Vercel.
- Sediakan Redis terkelola jika BullMQ tetap digunakan.
- Tentukan tempat menjalankan worker yang selalu aktif; Vercel Functions bukan proses daemon permanen.
- Masukkan `DATABASE_URL`, `SESSION_SECRET`, `APP_ORIGIN`, `REDIS_URL`, VAPID key, dan konfigurasi AI melalui Environment Variables Vercel.
- Jalankan migration production sebagai langkah deployment terkontrol, bukan dari request pengguna.
- Tetapkan domain HTTPS sebelum menguji Web Push pada handphone.
- Tambahkan error tracking, structured log, metric antrean, dan alert.
- Uji backup serta restore PostgreSQL.
- Uji Android Chrome dan iPhone Safari pada perangkat fisik.
- Sediakan Privacy Policy dan Terms yang sebenarnya.

## Smoke test setelah deployment

Minimal periksa:

1. halaman login dapat dibuka melalui HTTPS;
2. registrasi dan login bekerja;
3. pengguna A tidak dapat membaca data pengguna B;
4. target, rutinitas, dan tugas dapat dibuat;
5. proposal tidak mengaktifkan jadwal sebelum dikonfirmasi;
6. konfirmasi menghasilkan jadwal tanpa overlap;
7. reschedule dan undo bekerja;
8. readiness menunjukkan dependency production siap;
9. PWA dapat dipasang;
10. reminder test diterima perangkat dan kegagalan tercatat.

## Rollback minimum

- Simpan deployment Vercel terakhir yang sehat.
- Catat versi migration yang sudah diterapkan.
- Jangan mengandalkan rollback aplikasi jika schema lama tidak lagi kompatibel.
- Untuk migration berisiko, gunakan pola expand → migrate data → contract.
- Pulihkan database hanya dari backup yang pernah diuji proses restore-nya.
