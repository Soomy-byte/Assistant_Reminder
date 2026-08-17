# Fase 1 — Identity dan Onboarding

## Status

Dokumen ini adalah catatan historis fase akun yang selesai pada `0.2.0`. Fitur perencanaan berikutnya tersedia pada `0.3.0`.

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
- Unit test autentikasi tetap menjadi bagian dari rangkaian tes `0.3.0`.

## Batas fase

- Pengiriman email production belum dipilih. Pada development, tautan reset ditampilkan setelah permintaan berhasil; pada production, API tidak membocorkan token dan menunggu adapter email.
- CRUD tugas, rutinitas, Brain Dump, dan reminder kini tersedia pada `0.3.0`.

## Definition of Done

Pengguna lokal dapat membuat akun, masuk, menyimpan onboarding dan preferensi di PostgreSQL, membuka dashboard privat, memperbarui profil, keluar, serta memulihkan kata sandi melalui alur development.
