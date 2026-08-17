# Assistant Reminder v0.5.1

## Fokus versi

Versi ini merapikan repository tanpa mengubah perilaku fitur utama.

- Artefak build, cache, generated code, report test, dan adapter deployment lama tidak disertakan dalam source bersih.
- Dokumentasi dipusatkan di folder `docs/`.
- Script npm duplikat dihapus.
- Cache npm kembali memakai lokasi default pengguna, bukan `.sites-runtime` di repository.
- Script lintas platform `npm.cmd run clean` ditambahkan.
- Explorer VS Code menyembunyikan dependency, cache, generated code, dan report agar source aktif mudah dipelajari.
- README dan dokumen deployment sekarang menggambarkan jalur Next.js → GitHub → Vercel.

## Memperbarui proyek lokal

1. Pastikan perubahan lokal lama sudah di-commit dan di-push.
2. Salin isi paket v0.5.1 ke working tree proyek tanpa menyalin folder `.git`.
3. Pertahankan `.env` milikmu; jangan memasukkannya ke Git.
4. Hapus file/folder lama yang sudah digantikan dengan script terarah berikut:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-repository-v0.5.1.ps1
```

Script memverifikasi nama package sebelum menghapus daftar path lama. Ia tidak mengubah `.git`, `.env`, `node_modules`, atau data volume Docker.

5. Jalankan:

```powershell
npm.cmd install
npm.cmd test
git status
git diff
```

6. Jika pemeriksaan lulus, buat commit:

```powershell
git add .
git commit -m "chore: clean and organize repository for v0.5.1"
git push
```

## Catatan kompatibilitas database

Nama internal database development lama tetap dipertahankan agar data lokal tidak putus. Perubahan branding yang terlihat pengguna sudah menggunakan Assistant Reminder.
