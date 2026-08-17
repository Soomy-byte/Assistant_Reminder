# Panduan Memahami Assistant Reminder

Dokumen ini menjelaskan proyek dari sudut pandang belajar: apa komponennya, mengapa dipilih, bagaimana data mengalir, dan bagaimana mengujinya.

## 1. Tujuan proyek

Assistant Reminder mengubah target bulanan dan daftar tugas menjadi jadwal mingguan yang realistis, lalu menyajikan agenda harian yang mudah dibaca. AI hanya membantu menguraikan Brain Dump; keputusan akhir tetap divalidasi oleh aturan deterministik dan pengguna.

Tiga horizon perencanaannya adalah:

- Bulanan: `Goal` memberi arah.
- Mingguan: `Task`, `Routine`, dan `ScheduleProposal` mengatur kapasitas.
- Harian: `ScheduleBlock` menentukan kapan kegiatan dilaksanakan.

## 2. Arsitektur

| Komponen | Teknologi | Tanggung jawab |
|---|---|---|
| Web dan API | Next.js + React + TypeScript | Halaman, form, kalender, autentikasi, dan route API |
| Validasi | Zod | Menolak bentuk data yang salah sebelum menyentuh database |
| Data utama | PostgreSQL + Prisma | Akun, tugas, rutinitas, jadwal, versi, dan reminder |
| Antrean | Redis + BullMQ | Menahan pekerjaan notifikasi sampai waktunya tiba |
| Push worker | Node.js + Web Push | Mengirim reminder dan menjalankan retry/backoff |
| PWA | Manifest + service worker | Instalasi aplikasi, cache shell, offline baca-saja, dan menerima push |
| AI | Parser lokal atau adapter OpenAI | Mengubah teks bebas menjadi calon tugas yang harus direview |

Struktur folder penting:

- `app/`: halaman dan route API.
- `components/planner/`: UI planner interaktif.
- `components/pwa/`: registrasi service worker.
- `lib/auth/`: sesi, password, validasi, dan rate limit.
- `lib/planner/`: aturan waktu, rutinitas, dan perubahan kalender.
- `lib/scheduling/`: algoritme scheduler murni yang mudah diuji.
- `lib/ai/`: parser Brain Dump dan adapter AI.
- `prisma/`: schema dan migration PostgreSQL.
- `worker/`: proses pengiriman notifikasi terpisah.

## 3. Mengapa aplikasi memerlukan server

UI React dapat tampil di browser, tetapi data privat dan aturan konflik tidak aman jika hanya disimpan di browser. Server diperlukan untuk:

1. memverifikasi sesi pengguna;
2. membaca/menulis PostgreSQL;
3. menjalankan transaksi;
4. menyimpan subscription HP;
5. mengirim Web Push melalui worker.

Ketika belajar lokal, laptop berperan sebagai server. Untuk reminder 24 jam, server, PostgreSQL, Redis, dan worker harus dipasang pada layanan yang selalu aktif. HP juga harus membuka versi HTTPS karena Push API tidak bekerja pada alamat HTTP biasa di jaringan lokal.

## 4. Alur membuat jadwal

1. Pengguna membuat tugas dan rutinitas.
2. Route `/api/schedule/propose` membaca batas waktu, prioritas, jam tidur, hari aktif, rutinitas, dan jadwal yang sudah ada.
3. `lib/scheduling/engine.ts` mencari slot tanpa overlap.
4. Hasil disimpan sebagai `ScheduleProposal`, bukan langsung menjadi jadwal aktif.
5. Pengguna memeriksa preview.
6. `/api/schedule/confirm` membuat `ScheduleBlock` dan `NotificationJob` dalam transaksi.

Proposal dipakai agar algoritme tidak diam-diam mengubah kalender. Jika hasil tidak cocok, pengguna cukup menutup preview.

## 5. Memindahkan dan mengubah durasi

UI menyediakan dua cara:

- Desktop: seret kartu tugas ke hari lain.
- Desktop/HP/keyboard: ketuk kartu dan ubah `Mulai`, `Selesai`, serta `Ingatkan` di dialog.

Permintaan dikirim ke `/api/schedule-blocks/[id]`. Server kemudian:

1. memeriksa kepemilikan blok;
2. membandingkan `revision` untuk mendeteksi perubahan dari perangkat lain;
3. memvalidasi durasi, jam tidur, earliest start, dan deadline;
4. mencari konflik dengan blok dan rutinitas;
5. memperbarui blok, membatalkan reminder lama, membuat reminder baru, dan menulis audit event dalam satu transaksi.

PostgreSQL juga memiliki exclusion constraint `schedule_block_no_overlap`. Validasi aplikasi memberi pesan yang ramah; constraint database menjadi pagar terakhir jika dua perangkat menyimpan pada saat hampir bersamaan.

## 6. Cara kerja reminder

`NotificationJob` adalah sumber status reminder di database. Kunci idempotensi berisi ID blok, revision, dan offset sehingga versi reminder yang sama tidak bisa dibuat dua kali.

Alur Web Push:

1. Pengguna menekan ikon lonceng dan membaca penjelasan izin.
2. Browser membuat `PushSubscription`.
3. `/api/notifications/subscription` menyimpan endpoint dan kunci publik perangkat; maksimum 10 perangkat per akun.
4. Worker menyinkronkan job 24 jam ke depan ke Redis/BullMQ.
5. BullMQ menunggu sampai `scheduledFor`.
6. Worker mengirim payload terenkripsi melalui layanan push browser.
7. `public/sw.js` menerima event `push` dan menampilkan notifikasi.
8. Endpoint 404/410 dinonaktifkan. Gangguan sementara dicoba lagi maksimal lima kali dengan exponential backoff.

Web Push bersifat best effort: sistem tidak dapat menjamin milidetik tepat ketika HP offline, mode hemat baterai aktif, atau layanan push terlambat.

Tanpa worker/VAPID, polling `/api/reminders/due` tetap memberi reminder selama aplikasi terbuka.

## 7. PWA dan offline

`app/manifest.ts` membuat metadata instalasi. `public/sw.js` menyimpan shell dan aset statis, tetapi tidak menyimpan respons API privat. Planner terakhir disimpan di `localStorage` per browser.

Ketika koneksi hilang:

- agenda terakhir tetap dapat dibaca;
- banner Mode offline ditampilkan;
- operasi tulis ditolak dengan penjelasan;
- tidak ada merge otomatis yang berisiko menimpa perubahan perangkat lain.

Saat logout, cache planner, user lokal, dan cache service worker dibersihkan.

## 8. Brain Dump

Mode `mock` memahami pola waktu sederhana secara lokal dan tidak mengirim data keluar. Mode OpenAI memakai output terstruktur. Keduanya hanya menghasilkan calon tugas. Pengguna harus memeriksa dan mengonfirmasi sebelum data menjadi tugas; AI tidak pernah langsung mengaktifkan kalender.

## 9. Menjalankan untuk belajar

Terminal pertama:

```powershell
npm.cmd install
docker compose up -d postgres redis
npm.cmd run db:prisma:generate
npm.cmd run db:migrate
npm.cmd run dev
```

Untuk Web Push, buat kunci dengan `npm.cmd run notifications:keys`, salin ke `.env`, kemudian gunakan terminal kedua:

```powershell
npm.cmd run worker:notifications
```

## 10. Strategi pengujian

- `npm.cmd run test:unit`: menguji autentikasi, waktu/zona waktu, rutinitas, scheduler, dan aturan pemindahan jadwal.
- `npm.cmd run typecheck`: memastikan bentuk data TypeScript konsisten.
- `npm.cmd run lint`: mencari pola kode bermasalah.
- `npm.cmd run build`: membuktikan bundel production dapat dibuat.
- Uji manual: buat tugas, konfirmasi proposal, pindahkan blok, coba konflik, ubah reminder, offline-kan browser, lalu aktifkan kembali.

## 11. Batas yang perlu diketahui

- PWA di HP memerlukan HTTPS.
- Worker harus selalu hidup untuk push latar belakang.
- Redis menyimpan antrean, sedangkan PostgreSQL tetap menjadi sumber kebenaran.
- Offline V1 hanya baca-saja.
- Pengiriman email reset password, observability production, backup terkelola, E2E lintas browser, dan deployment masih menjadi tahap hardening berikutnya.
