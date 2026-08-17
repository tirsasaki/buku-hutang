# 📒 Buku Hutang

Aplikasi web sederhana untuk mencatat hutang pelanggan toko/warung — menggantikan cara manual pakai Excel atau buku catatan. Cocok dipakai bareng-bareng dengan keluarga atau siapa pun yang biasa menerima pembayaran dari pelanggan.

## ✨ Fitur

- 📋 Daftar pelanggan dengan sisa hutang otomatis terhitung
- 🧾 Rincian hutang per barang (bukan cuma total, tapi detail satu-satu)
- 💰 Bisa bayar sebagian (dicicil) atau tandai lunas sekali tap
- 👤 Tercatat siapa yang menerima setiap pembayaran
- 📱 Bisa dibuka bareng-bareng dari beberapa HP, datanya otomatis sinkron
- 💬 Bagikan rincian hutang ke WhatsApp pelanggan dengan sekali tap
- 🔒 Login pakai 1 akun saja, aman dari orang luar

---

## 🧰 Yang perlu disiapkan dulu

Sebelum mulai, pastikan sudah punya:

1. **Node.js** terpasang di komputer. Cek dengan buka terminal, ketik:
   ```bash
   node -v
   ```
   Kalau muncul pesan "command not found", instal dulu:
   - CachyOS/Arch: `sudo pacman -S nodejs npm`
   - Distro Linux lain: kunjungi [nodejs.org](https://nodejs.org)

2. **Akun GitHub** — daftar gratis di [github.com](https://github.com) kalau belum punya

3. **Akun Supabase** — daftar gratis di [supabase.com](https://supabase.com), ini yang jadi "database" penyimpan data hutang Anda

4. **Akun Vercel** — daftar gratis di [vercel.com](https://vercel.com) (bisa langsung pakai akun GitHub), ini yang membuat website Anda bisa diakses online

---

## 🚀 Langkah 1 — Setup Database di Supabase

1. Login ke [supabase.com](https://supabase.com/dashboard), klik **"New Project"**
2. Isi nama project (bebas, misal `buku-hutang`), pilih region **Southeast Asia (Singapore)** biar akses dari Indonesia cepat, buat password database (catat baik-baik, beda dari password login nanti)
3. Tunggu 1-2 menit sampai project selesai dibuat
4. Di sidebar kiri, klik **SQL Editor** → **New query**
5. Buka file `skema-database.sql` yang ada di folder ini, copy semua isinya, paste ke SQL Editor
6. Klik tombol **Run** (atau `Ctrl+Enter`)
7. Cek hasilnya: klik menu **Table Editor** di sidebar — harus muncul 3 tabel: `customers`, `debt_items`, `payments`

### Buat akun login

1. Klik menu **Authentication** → tab **Users**
2. Klik **Add user** → **Create new user**
3. Isi email & password Anda sendiri — ini satu-satunya akun yang dipakai untuk login ke aplikasi
4. Masih di menu Authentication, cari pengaturan **"Enable email signups"**, lalu **matikan** — supaya tidak ada orang lain bisa daftar sendiri

### Aktifkan sinkronisasi otomatis (Realtime)

1. Klik menu **Database** → **Replication**
2. Cari tabel `customers`, `debt_items`, `payments`
3. Aktifkan toggle Realtime untuk ketiganya

> Tanpa langkah ini, aplikasi tetap jalan normal, tapi perubahan dari HP lain tidak otomatis muncul sampai halaman di-refresh.

### Catat kunci API-nya

1. Klik ikon gerigi **Settings** → **API**
2. Catat dua hal ini (nanti dipakai di langkah 3):
   - **Project URL** — bentuknya `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** — deretan huruf/angka panjang

---

## 💻 Langkah 2 — Coba jalankan di komputer dulu

Buka terminal, masuk ke folder proyek ini, lalu jalankan:

```bash
npm install
```

Tunggu sampai selesai (proses download dependency, biasanya 1-2 menit).

Buat file konfigurasi:

```bash
cp .env.local.example .env.local
```

Buka file `.env.local` pakai text editor apa saja, ganti isinya dengan Project URL dan anon key dari Langkah 1 tadi:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dengan_anon_key_anda
```

Jalankan aplikasinya:

```bash
npm run dev
```

Buka browser, kunjungi `http://localhost:3000`, coba login pakai email & password yang dibuat di Langkah 1. Kalau berhasil masuk dan bisa tambah pelanggan, berarti semuanya sudah tersambung dengan benar. 🎉

---

## ☁️ Langkah 3 — Simpan kode ke GitHub

Masih di folder proyek, jalankan satu-satu:

```bash
git init
git add .
git commit -m "Setup awal Buku Hutang"
```

Buka [github.com/new](https://github.com/new), buat repository baru (boleh private supaya tidak dilihat orang lain), **jangan centang** opsi "Add README" karena sudah ada. Setelah dibuat, GitHub akan kasih beberapa baris perintah — atau bisa pakai ini (ganti `USERNAME` dan `NAMA-REPO`):

```bash
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git branch -M main
git push -u origin main
```

> 🔒 Tenang, file `.env.local` yang berisi kunci rahasia Supabase **tidak akan ikut ter-upload** ke GitHub — sudah otomatis diblok lewat file `.gitignore`.

---

## 🌍 Langkah 4 — Deploy supaya bisa diakses online

1. Login ke [vercel.com](https://vercel.com) pakai akun GitHub
2. Klik **Add New** → **Project**
3. Pilih repository yang baru saja di-push
4. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan 2 baris:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key dari Supabase |

5. Klik **Deploy**, tunggu 1-2 menit
6. Setelah selesai, Vercel kasih link seperti `nama-proyek.vercel.app` — coba buka, harusnya aplikasi Anda sudah bisa diakses dari mana saja!

### Sambungkan domain sendiri (opsional)

1. Di dashboard project Vercel, buka **Settings** → **Domains**
2. Masukkan domain Anda (misal `bukuhutang.com`), klik **Add**
3. Vercel akan kasih instruksi (biasanya tambah CNAME atau A record)
4. Buka pengaturan DNS di tempat Anda beli domain, tambahkan record sesuai instruksi tadi
5. Tunggu beberapa menit sampai beberapa jam untuk domain aktif

---

## 📱 Cara pakai sehari-hari

- Buka link Vercel atau domain Anda di HP (Anda, istri, anak)
- Di browser HP, pilih **"Add to Home Screen"** biar terasa seperti aplikasi asli
- Semua orang login pakai akun yang sama (1 email & password)
- Data otomatis sinkron real-time antar HP selama semua terhubung internet

---

## 🔧 Kalau nanti mau update tampilan/fitur

1. Edit file yang diinginkan
2. Jalankan:
   ```bash
   git add .
   git commit -m "keterangan perubahan"
   git push
   ```
3. Vercel otomatis build ulang dan update website dalam 1-2 menit, tidak perlu setting apa-apa lagi

---

## 🌐 Mengaktifkan mode multi-user (siapa saja bisa daftar akun sendiri)

Secara default, proyek ini disiapkan untuk **1 akun saja**. Kalau Anda ingin membuka aplikasi ini supaya **orang lain juga bisa daftar akun sendiri** dan mencatat buku hutang mereka masing-masing (terpisah, tidak saling lihat data satu sama lain), ikuti langkah berikut:

### Kalau Anda sudah punya data (sudah pakai versi 1 akun sebelumnya)

1. Buka **SQL Editor** di Supabase
2. Buka file `skema-migrasi-multiuser.sql` di folder ini
3. **Penting:** sebelum menjalankan, cari baris `GANTI_DENGAN_USER_ID_ANDA` (ada 3 baris), ganti dengan User ID akun Anda sendiri
   - Cara dapatkan: menu **Authentication** → **Users** → klik akun Anda → copy **User UID**
4. Paste seluruh script yang sudah diedit ke SQL Editor, klik **Run**
5. Cek di **Table Editor**, kolom `user_id` di ketiga tabel harus sudah terisi (tidak ada yang kosong)

### Kalau baru mulai dari nol (belum ada data sama sekali)

Pakai `skema-database.sql` seperti biasa, tapi tambahkan kolom `user_id` di setiap tabel dan gunakan bagian "LANGKAH 3" dan "LANGKAH 4" dari `skema-migrasi-multiuser.sql` (skip LANGKAH 1 dan 2 karena belum ada data lama).

### Izinkan orang lain mendaftar

1. Menu **Authentication** → **Providers** (atau **Settings**)
2. Cari **"Enable email signups"**, **aktifkan** kembali (kebalikan dari setup 1 akun sebelumnya)
3. Disarankan tetap aktifkan **konfirmasi email** (opsi "Confirm email") — supaya orang yang daftar wajib klik link konfirmasi dulu sebelum bisa login, mengurangi akun asal-asalan

### Aktifkan fitur lupa password

Sekarang ada halaman "Lupa password" yang bisa dipakai pengguna kalau lupa password mereka. Supaya link resetnya berfungsi dengan benar:

1. Menu **Authentication** → **URL Configuration**
2. Di kolom **Redirect URLs**, tambahkan: `https://domain-anda.com/reset-password` (ganti dengan domain/URL Vercel Anda)
3. Simpan

Tanpa langkah ini, link reset password yang dikirim ke email pengguna tidak akan berfungsi dengan benar.

---

### Apa yang berubah di aplikasi

- Ada halaman baru `/signup` untuk daftar akun
- Ada halaman baru `/forgot-password` dan `/reset-password` untuk lupa password
- Halaman login sekarang ada link "Daftar gratis" dan "Lupa password?"
- Kalau ada yang mencoba daftar pakai email yang sudah terdaftar, muncul pesan yang jelas mengarahkan mereka untuk masuk atau reset password
- Setiap akun cuma bisa melihat dan mengubah data miliknya sendiri — dijamin oleh Supabase di level database (Row Level Security), bukan cuma di tampilan aplikasi, jadi tetap aman meski ada yang coba akses lewat cara lain

### Hal yang perlu dipikirkan kalau dibuka untuk umum

- **Biaya**: paket gratis Supabase punya batas penyimpanan dan jumlah pengguna aktif bulanan. Kalau makin banyak yang pakai, cek dashboard Supabase Anda untuk tahu kapan perlu upgrade ke paket berbayar
- **Kebijakan privasi**: karena sekarang menyimpan data orang lain, ada baiknya siapkan halaman sederhana yang menjelaskan data apa yang disimpan dan untuk apa
- **Dukungan pengguna**: siap-siap ada yang bertanya kalau lupa password atau mengalami kendala

---



**Error waktu `npm run dev` atau `npm run build`**
Coba hapus folder `node_modules` dan file `package-lock.json`, lalu `npm install` ulang.

**Login gagal terus padahal email/password benar**
Cek lagi apakah `.env.local` sudah diisi dengan Project URL dan anon key yang benar (bukan yang di dalam tanda kurung `< >`).

**Data tidak sinkron antar HP**
Pastikan sudah mengaktifkan Realtime di Supabase untuk ketiga tabel (lihat Langkah 1 bagian "Aktifkan sinkronisasi otomatis").

**Halaman blank/putih setelah deploy ke Vercel**
Cek apakah Environment Variables di Vercel sudah diisi dengan benar (Settings → Environment Variables di dashboard project Vercel Anda).

---

## 🔐 Catatan keamanan

- Hanya ada 1 akun login — jaga baik-baik email & password-nya
- Data dilindungi Row Level Security di Supabase — tanpa login, data sama sekali tidak bisa diakses dari luar
- File `.env.local` jangan pernah dibagikan atau di-commit ke repository publik
