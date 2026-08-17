# Fase 1 — Identity dan Onboarding

## Status

Fase 1 selesai pada source lokal versi `0.2.0`.

## Cakupan yang tersedia

- Registrasi akun dengan email, nama, dan kata sandi kuat.
- Hash kata sandi bcrypt cost 12.
- Login, logout, sesi 30 hari, dan cookie aman.
- Pembatasan percobaan registrasi, login, serta lupa kata sandi.
- Reset kata sandi dengan token acak, satu-kali, dan kedaluwarsa 30 menit.
- Invalidasi seluruh sesi setelah kata sandi direset.
- Onboarding zona waktu, format jam, hari aktif, jam tidur, batas fokus, jeda, dan pengingat.
- Halaman pengaturan untuk mengubah profil dan preferensi.
- Dashboard dilindungi dan menggunakan nama serta zona waktu dari akun aktif.
- Audit event untuk aktivitas identitas penting.

## Pemeriksaan penerimaan

- Prisma schema valid.
- Migration `0002_phase_1_identity` tersedia.
- ESLint lulus.
- Next.js production build lulus.
- Sites artifact build lulus.
- Sembilan unit test lulus.
- Render test memastikan dashboard dialihkan ke login dan halaman login dapat dirender.

## Batas fase

- Pengiriman email production belum dipilih. Pada development, tautan reset ditampilkan setelah permintaan berhasil; pada production, API tidak membocorkan token dan menunggu adapter email.
- CRUD tugas, rutinitas, Brain Dump AI, dan notifikasi berada pada fase berikutnya.
- Versi website online tidak diperbarui dalam fase lokal ini.

## Definition of Done

Pengguna lokal dapat membuat akun, masuk, menyimpan onboarding dan preferensi di PostgreSQL, membuka dashboard privat, memperbarui profil, keluar, serta memulihkan kata sandi melalui alur development.
