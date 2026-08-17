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

## ❓ Troubleshooting

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