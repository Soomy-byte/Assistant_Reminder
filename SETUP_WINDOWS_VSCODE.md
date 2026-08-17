# Menjalankan AI Weekly Assistant di Windows dan Visual Studio Code

Panduan ini menggunakan Docker Desktop untuk PostgreSQL dan Redis agar instalasi lebih konsisten.

## 1. Instal aplikasi pendukung

Instal:

- Visual Studio Code.
- Node.js versi 22 LTS atau lebih baru.
- Git for Windows.
- Docker Desktop dengan WSL 2.

Setelah selesai, restart Windows bila diminta.

## 2. Buka proyek

1. Ekstrak ZIP proyek.
2. Buka Visual Studio Code.
3. Pilih **File → Open Folder**.
4. Pilih folder `ai-weekly-assistant`.
5. Buka terminal melalui **Terminal → New Terminal**.

## 3. Instal dependensi

Jalankan:

```powershell
npm install
```

## 4. Siapkan environment

Salin `.env.example` menjadi `.env`:

```powershell
Copy-Item .env.example .env
```

Untuk konfigurasi Docker bawaan, ubah `DATABASE_URL` dalam `.env` menjadi:

```env
DATABASE_URL="postgresql://weekly_user:weekly_password@localhost:5432/weekly_assistant?schema=public"
```

Buat nilai acak yang panjang untuk `SESSION_SECRET`. Di PowerShell:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Salin hasilnya ke `SESSION_SECRET` di `.env`. Jangan mengunggah `.env` ke repository.

## 5. Jalankan PostgreSQL dan Redis

Pastikan Docker Desktop aktif, lalu jalankan:

```powershell
docker compose up -d
```

Periksa status:

```powershell
docker compose ps
```

Kedua layanan harus berstatus healthy atau running.

## 6. Terapkan struktur database

Jalankan:

```powershell
npm run db:prisma:generate
npm run db:migrate
```

Migration mencakup constraint PostgreSQL untuk mencegah blok jadwal aktif bertabrakan.

## 7. Jalankan aplikasi

```powershell
npm run dev:local
```

Buka alamat yang ditampilkan terminal. Umumnya aplikasi tersedia pada:

```text
http://localhost:3000
```

Jika terminal menampilkan port berbeda, gunakan alamat dari terminal.

## 8. Buat akun pertama

1. Buka `http://localhost:3000/register`.
2. Daftarkan nama, email, dan kata sandi yang memenuhi aturan.
3. Lengkapi zona waktu, hari aktif, jam tidur, dan batas fokus.
4. Setelah onboarding tersimpan, dashboard akan terbuka.

Alur **Lupa kata sandi** siap untuk development. Karena layanan email belum dipilih, tautan reset lokal muncul di halaman setelah email dikirim. Pada mode production, token tersebut tidak dikembalikan lewat API dan harus dikirim melalui adapter email.

## 9. Pemeriksaan source

```powershell
npm run lint:local
npm run test:unit
npm run build:local
```

## 10. Melihat database

```powershell
npm run db:studio
```

Prisma Studio membuka antarmuka untuk memeriksa tabel dan data secara lokal.

## 11. Menghentikan layanan

Menghentikan container tanpa menghapus data:

```powershell
docker compose stop
```

Menjalankan kembali:

```powershell
docker compose start
```

Hindari `docker compose down -v` karena opsi `-v` menghapus data PostgreSQL dan Redis lokal.

## Status pengembangan

Fase 1 sudah tersedia: registrasi, login, logout, pemulihan kata sandi lokal, sesi aman, onboarding, dan pengaturan profil. CRUD tugas persisten, koneksi AI, serta Web Push akan ditambahkan pada fase berikutnya.
