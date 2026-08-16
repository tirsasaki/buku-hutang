# Buku Hutang — Next.js + Supabase

## 1. Sebelum mulai
Pastikan sudah punya:
- Node.js terpasang (`node -v` untuk cek; kalau belum, di CachyOS: `sudo pacman -S nodejs npm`)
- Project Supabase yang sudah dibuat + tabel sudah dijalankan (`skema-database.sql`)
- Akun login sudah dibuat di Supabase Authentication > Users
- Project URL dan anon public key dari Supabase (Settings > API)

## 2. Setup lokal (buat coba dulu di komputer sebelum deploy)

```bash
cd buku-hutang-nextjs
npm install
cp .env.local.example .env.local
```

Buka file `.env.local`, isi dengan Project URL dan anon key Anda:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dengan_anon_public_key_anda
```

Jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000` di browser, login pakai akun yang dibuat di Supabase tadi.

## 3. Aktifkan Realtime di Supabase (WAJIB, biar sinkron antar HP)

1. Buka dashboard Supabase → menu **Database** → **Replication**
2. Cari 3 tabel: `customers`, `debt_items`, `payments`
3. Aktifkan toggle Realtime untuk ketiganya

Tanpa ini, aplikasi tetap jalan, tapi perubahan dari HP lain tidak otomatis muncul sampai halaman di-refresh manual.

## 4. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit - Buku Hutang"
```

Buat repo baru di github.com (boleh private), lalu:

```bash
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git branch -M main
git push -u origin main
```

`.env.local` TIDAK akan ikut ter-push (sudah diblok lewat `.gitignore`) — ini penting supaya kunci Supabase Anda tidak bocor ke publik.

## 5. Deploy ke Vercel

1. Buka vercel.com, login pakai akun GitHub Anda
2. Klik **"Add New" → "Project"**
3. Pilih repo GitHub yang tadi di-push
4. Sebelum klik Deploy, buka bagian **"Environment Variables"**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` → isi dengan Project URL Supabase Anda
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → isi dengan anon key Supabase Anda
5. Klik **Deploy**, tunggu sampai selesai (biasanya 1-2 menit)

## 6. Sambungkan domain custom

1. Di dashboard project Vercel Anda, buka tab **"Settings" → "Domains"**
2. Masukkan domain Anda, klik **Add**
3. Vercel akan kasih instruksi DNS (biasanya CNAME atau A record)
4. Buka pengaturan DNS di tempat Anda beli domain, tambahkan record sesuai instruksi Vercel
5. Tunggu beberapa menit sampai beberapa jam untuk propagasi DNS

## 7. Pemakaian sehari-hari

- Buka domain Anda di HP (Anda, istri, anak — install sebagai "Add to Home Screen" di browser HP masing-masing)
- Semua login pakai 1 akun yang sama (email & password yang dibuat di Supabase)
- Data otomatis sinkron real-time antar HP selama semua terhubung internet

## Catatan tentang keamanan

- Hanya ada 1 akun login, jadi jaga baik-baik email & password-nya
- Data dilindungi Row Level Security di Supabase — tanpa login, data tidak bisa diakses sama sekali
- Kalau nanti mau update kode: edit filenya, `git add . && git commit -m "update" && git push` — Vercel otomatis deploy ulang
