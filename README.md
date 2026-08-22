# 📒 Buku Hutang

Aplikasi Next.js untuk mencatat hutang pelanggan toko atau warung. Data disimpan di Supabase dan dapat digunakan dari beberapa perangkat dengan akun masing-masing.

## ✨ Fitur

- 🔐 Login, pendaftaran akun, dan reset password dengan Supabase Auth
- 👥 Data pelanggan dengan nama, nomor telepon, dan saldo hutang
- 🧾 Catatan hutang per barang, jumlah, nominal, tanggal, dan kasir
- 💰 Pembayaran penuh maupun cicilan
- 🙋 Pencatatan penerima pembayaran
- 💳 Pencatatan saldo kredit pelanggan
- 🔎 Pencarian, pengurutan, dan filter status hutang
- 🔄 Sinkronisasi data real-time antar perangkat
- 💬 Berbagi rincian hutang melalui WhatsApp
- 🌓 Tema terang dan gelap
- 📱 Dukungan Progressive Web App (PWA)

## 🗂️ Struktur project

```text
app/
├── page.jsx                  # Halaman utama dan fitur buku hutang
├── layout.jsx                # Root layout, metadata, footer, dan analytics
├── globals.css               # Style global dan variabel tema
├── ThemeSwitcher.jsx         # Pengubah tema
├── RegisterSW.jsx             # Registrasi service worker
├── login/page.jsx             # Halaman masuk
├── signup/page.jsx            # Halaman pendaftaran
├── forgot-password/page.jsx  # Permintaan reset password
└── reset-password/page.jsx   # Pengaturan password baru
lib/
└── supabaseClient.js          # Client Supabase
public/
├── manifest.json              # Konfigurasi PWA
├── sw.js                      # Service worker
└── *.png                      # Ikon aplikasi
```

## 🧰 Persyaratan

- Node.js dan npm
- Project Supabase
- Akun Vercel, jika project akan di-deploy

## 🗄️ Konfigurasi Supabase

Skema database dikelola langsung di project Supabase. Pastikan tersedia tabel berikut:

| Tabel | Kegunaan |
| --- | --- |
| `customers` | Data pelanggan |
| `debt_items` | Catatan hutang per barang |
| `payments` | Pembayaran hutang |
| `credit_transactions` | Transaksi saldo kredit pelanggan |

Setiap tabel data harus memiliki `user_id` untuk menghubungkan data dengan akun pemiliknya. Aktifkan **Row Level Security (RLS)** pada semua tabel dan buat policy agar pengguna hanya dapat membaca, menambah, mengubah, dan menghapus data miliknya sendiri.

### 🔑 Authentication

Di Supabase Dashboard:

1. Buka **Authentication → Providers** dan aktifkan provider Email.
2. Aktifkan atau nonaktifkan konfirmasi email sesuai kebutuhan aplikasi.
3. Buat akun melalui halaman `/signup`, atau melalui menu **Authentication → Users**.
4. Buka **Authentication → URL Configuration**.
5. Tambahkan URL berikut ke **Redirect URLs**:
   - `http://localhost:3000/reset-password` untuk development
   - `https://domain-anda.com/reset-password` untuk production

### 🔄 Realtime

Aktifkan Realtime untuk tabel `customers`, `debt_items`, `payments`, dan `credit_transactions`. Tanpa konfigurasi ini, aplikasi tetap dapat digunakan, tetapi perubahan dari perangkat lain tidak langsung ditampilkan.

## 💻 Menjalankan secara lokal

Install dependency:

```bash
npm install
```

Buat file environment dari template:

```bash
cp .env.local.example .env.local
```

Isi `.env.local` dengan nilai dari **Supabase Dashboard → Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dengan_anon_public_key_anda
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu masuk atau buat akun baru.

## 🛠️ Script npm

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan development server |
| `npm run build` | Membuat production build |
| `npm run start` | Menjalankan production build |
| `npm run lint` | Memeriksa kode dengan lint |

## ☁️ Deploy ke Vercel

1. Push project ke repository GitHub.
2. Import repository tersebut di Vercel.
3. Tambahkan environment variables berikut di pengaturan project Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**.
5. Tambahkan URL production dan `/reset-password` ke **Redirect URLs** di Supabase.

Setiap push baru ke branch yang terhubung akan memicu deployment otomatis.

## 📱 Penggunaan di perangkat lain

1. Buka URL production dari HP atau komputer lain.
2. Masuk menggunakan akun yang sudah terdaftar, atau buat akun baru melalui `/signup`.
3. Untuk pengalaman seperti aplikasi, gunakan fitur **Add to Home Screen** dari browser.

Data antar pengguna dipisahkan oleh `user_id` dan policy RLS Supabase. Uji dengan dua akun untuk memastikan setiap akun hanya melihat datanya sendiri.

## 🔒 Keamanan

- Jangan commit atau membagikan file `.env.local`.
- Jangan menonaktifkan RLS pada tabel aplikasi.
- Anon key memang digunakan oleh browser, tetapi akses data tetap harus dibatasi oleh policy RLS.
- Jangan menaruh service role key Supabase di frontend atau file environment yang diawali `NEXT_PUBLIC_`.

## 🩺 Troubleshooting

### Login atau data gagal dimuat

Periksa URL dan anon key di `.env.local`. Pastikan tabel, kolom `user_id`, policy RLS, dan akun Supabase sudah tersedia.

### Data tidak sinkron antar perangkat

Pastikan Realtime aktif untuk keempat tabel aplikasi dan koneksi internet tersedia.

### Reset password tidak kembali ke aplikasi

Pastikan URL `/reset-password` untuk localhost dan production sudah terdaftar di **Supabase → Authentication → URL Configuration → Redirect URLs**.

### Halaman blank setelah deploy

Periksa environment variables di Vercel dan buka log build/deployment untuk melihat detail error.