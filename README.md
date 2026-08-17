# Assistant Reminder

Aplikasi perencanaan personal harian, mingguan, dan bulanan. Pengguna membuat target, tugas, serta rutinitas; scheduler menghasilkan proposal jadwal realistis tanpa mengubah kalender sebelum dikonfirmasi.

## Fitur v0.4.0

- Kalender Minggu interaktif dengan navigasi minggu dan drag-and-drop pada desktop.
- Dialog alternatif untuk mengubah tanggal, jam mulai, jam selesai, dan reminder pada desktop maupun HP.
- Validasi jam tidur, earliest start, deadline, konflik rutinitas, dan konflik blok jadwal.
- Optimistic revision serta PostgreSQL exclusion constraint untuk mencegah race condition.
- Pembaruan jadwal, pembatalan reminder lama, dan pembuatan reminder baru dalam satu transaksi.
- Mode offline baca-saja dengan indikator yang jelas dan cache jadwal terakhir.
- Web Push subscription, service worker push handler, Redis/BullMQ queue, retry, dan worker notifikasi.
- Tombol utama pada seluruh form selalu terlihat jelas.

## Fitur v0.3.2

- Seluruh branding antarmuka, metadata browser, dan PWA menggunakan nama Assistant Reminder.
- Paket proyek memakai nama `assistant-reminder` tanpa mengubah database lama.

## Fitur UI v0.3.1

- UI planner kembali memakai nuansa dashboard v2.0.
- Tombol aksi pada Target dan Rutinitas sudah terlihat normal.
- Halaman tanpa data sekarang memiliki empty state dan tombol tindakan.
- Ringkasan progres, fokus berikutnya, dan tugas belum terjadwal tampil di dashboard.
- Rentang kalender diperluas menjadi 75 hari agar pemuatan planner tidak ditolak.

## Fitur inti v0.3.0

- Akun, sesi aman, onboarding, dan preferensi waktu.
- CRUD target bulanan, tugas, dan rutinitas mingguan.
- Agenda harian, kalender mingguan, dan ringkasan bulanan.
- Scheduler berdasarkan deadline, prioritas, hari aktif, tidur, fokus, jeda, dan task splitting.
- Preview proposal, konfirmasi, reschedule, snapshot, dan undo.
- Brain Dump lokal tanpa API key serta adapter OpenAI opsional.
- Reminder browser ketika aplikasi terbuka.
- PWA dengan cache aset statis; data API privat tidak di-cache.
- Constraint PostgreSQL untuk menolak jadwal aktif yang overlap.

Runtime disatukan menjadi Next.js. Template Cloudflare, Vinext, Drizzle, D1, dan Redis yang belum digunakan telah dihapus.

## Menjalankan

Prasyarat: Node.js 22.13+, Docker Desktop, dan VS Code.

```powershell
npm.cmd install
Copy-Item .env.example .env
docker compose up -d postgres redis
npm.cmd run db:prisma:generate
npm.cmd run db:migrate
npm.cmd run test:unit
npm.cmd run dev
```

Isi `SESSION_SECRET` di `.env` dengan nilai acak minimal 32 karakter. Buka `http://localhost:3000`.

## Notifikasi Web Push

Untuk reminder ketika PWA tidak sedang terbuka, buat kunci VAPID satu kali:

```powershell
npm.cmd run notifications:keys
```

Salin hasilnya ke `.env`, lalu jalankan worker pada terminal VS Code kedua:

```powershell
npm.cmd run worker:notifications
```

Pada handphone, PWA dan Web Push memerlukan deployment HTTPS. Proses web, PostgreSQL, Redis, dan worker harus tetap aktif agar reminder dapat dikirim. Pengiriman bersifat best effort ketika perangkat atau layanan push sedang offline.

## AI opsional

Default `AI_PROVIDER="mock"` memakai parser lokal dan tidak mengirim data ke luar. Untuk OpenAI, isi `AI_PROVIDER="openai"`, `AI_API_KEY`, dan `AI_MODEL`. Semua hasil selalu divalidasi dan diperiksa pengguna sebelum menjadi tugas.

## Batas lokal

Tanpa kunci VAPID dan worker, reminder tetap bekerja saat aplikasi terbuka. Reminder 24 jam memerlukan deployment HTTPS dan infrastruktur yang selalu aktif.

Baca `SETUP_WINDOWS_VSCODE.md` dan `docs/PROJECT_GUIDE.md`.
