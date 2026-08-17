# Arsitektur v0.3.0

- Next.js modular monolith untuk UI dan API.
- PostgreSQL sebagai sumber data utama.
- Prisma sebagai data access layer.
- Scheduler deterministik sebagai fungsi murni.
- Browser service worker untuk aset statis dan reminder lokal.
- Parser lokal atau OpenAI Responses API untuk Brain Dump.

## Alur utama

`Target → Tugas → Scheduler → Proposal → Konfirmasi → ScheduleBlock → Reminder`

Scheduler mempertimbangkan rutinitas, blok aktif, hari kerja, tidur, deadline, prioritas, fokus maksimum, jeda minimum, serta izin pemecahan tugas. Engine tidak menulis database. Konfirmasi proposal melakukan transaction dan PostgreSQL menjadi penjaga overlap terakhir.

## Waktu dan keamanan

- Instant disimpan sebagai UTC `timestamptz`.
- Rutinitas disimpan sebagai aturan wall clock dengan zona IANA.
- Rentang menggunakan bentuk setengah terbuka `[mulai, selesai)`.
- Semua query domain mengambil `userId` dari sesi server.
- Cookie sesi `HttpOnly` dan `SameSite=Lax`.
- Mutasi memeriksa origin; proxy header hanya dipercaya ketika `TRUST_PROXY=true`.
- Brain Dump dibatasi dan output divalidasi ulang.

## Reminder

Job disimpan di PostgreSQL dan dipolling browser setiap menit. Versi lokal tidak menjanjikan notifikasi ketika aplikasi tertutup. Deployment 24 jam memerlukan worker dan Web Push.
