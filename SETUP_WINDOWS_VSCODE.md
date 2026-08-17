# Setup Windows dan VS Code

## 1. Prasyarat

Instal Node.js 22 LTS, VS Code, Git, dan Docker Desktop. Jalankan terminal dari folder yang berisi `package.json`, bukan `C:\Windows\System32`.

```powershell
node --version
npm.cmd --version
docker compose version
```

## 2. Instalasi

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Gunakan `npm.cmd` bila PowerShell memblokir `npm.ps1`.

Isi `.env`:

```env
DATABASE_URL="postgresql://weekly_user:weekly_password@localhost:5432/weekly_assistant?schema=public"
SESSION_SECRET="nilai-acak-minimal-32-karakter"
APP_ORIGIN="http://localhost:3000"
TRUST_PROXY="false"
AI_PROVIDER="mock"
REDIS_URL="redis://localhost:6379"
WEB_PUSH_PUBLIC_KEY=""
WEB_PUSH_PRIVATE_KEY=""
WEB_PUSH_SUBJECT="mailto:email-kamu@example.com"
```

## 3. Database

```powershell
docker compose up -d postgres redis
docker compose ps
npm.cmd run db:prisma:generate
npm.cmd run db:migrate
```

Migration `0003_planner_mvp` meningkatkan database v0.2 tanpa menghapus akun lama.

## 4. Pemeriksaan dan menjalankan

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run lint:local
npm.cmd run build
npm.cmd run dev
```

Buka `http://localhost:3000`.

## 5. Uji manual

1. Registrasi dan onboarding.
2. Buat target bulanan.
3. Buat rutinitas tetap.
4. Buat beberapa tugas fleksibel.
5. Buka Minggu dan buat proposal.
6. Periksa lalu konfirmasi.
7. Tandai tugas selesai.
8. Uji susun ulang dan Undo.
9. Buka Minggu, seret tugas ke hari lain, lalu ubah jam dan reminder lewat dialog.
10. Coba pindahkan tugas ke waktu rutinitas untuk melihat penolakan konflik.
11. Uji Brain Dump serta pengingat browser.

## 6. Notifikasi handphone/Web Push

Buat pasangan kunci satu kali:

```powershell
npm.cmd run notifications:keys
```

Salin hasilnya ke `.env`. Setelah itu buka terminal kedua:

```powershell
npm.cmd run worker:notifications
```

Klik ikon lonceng di aplikasi untuk mendaftarkan browser. Pengujian di handphone memerlukan deployment HTTPS; alamat IP lokal melalui HTTP tidak memenuhi syarat keamanan Push API.

Tekan `Ctrl+C` pada kedua terminal untuk menghentikan Next.js dan worker. Gunakan `docker compose stop` untuk menghentikan PostgreSQL serta Redis tanpa menghapus data.
