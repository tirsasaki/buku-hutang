# 📒 Buku Hutang

**Buku Hutang** adalah aplikasi pencatatan hutang pelanggan berbasis web, dibuat khusus untuk toko, warung, atau usaha kecil yang masih mengandalkan buku catatan manual. Aplikasi ini dibangun dengan **Next.js** dan **Supabase**, bisa diakses dari HP maupun komputer, datanya otomatis tersinkron secara real-time, dan bisa dipasang seperti aplikasi native lewat dukungan PWA (Progressive Web App).

> Dibuat oleh [tirsasaki](https://github.com/tirsasaki) — versi produksi berjalan di **bukuhutang.web.id**.

---

## 📑 Daftar Isi

- [Kenapa Buku Hutang?](#-kenapa-buku-hutang)
- [Fitur Utama](#-fitur-utama)
- [Cuplikan Alur Penggunaan](#️-cuplikan-alur-penggunaan)
- [Tumpukan Teknologi](#-tumpukan-teknologi)
- [Struktur Project](#️-struktur-project)
- [Persyaratan](#-persyaratan)
- [Konfigurasi Supabase](#️-konfigurasi-supabase)
- [Instalasi & Menjalankan Secara Lokal](#-instalasi--menjalankan-secara-lokal)
- [Script npm](#️-script-npm)
- [Deploy ke Vercel](#️-deploy-ke-vercel)
- [Penggunaan di Banyak Perangkat](#-penggunaan-di-banyak-perangkat)
- [Keamanan](#-keamanan)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🤔 Kenapa Buku Hutang?

Banyak toko dan warung masih mencatat hutang pelanggan di buku kertas: mudah hilang, sobek, tidak ada cadangan, dan sulit dicari kalau pelanggannya sudah banyak. **Buku Hutang** menggantikan buku catatan itu dengan aplikasi web sederhana yang:

- Bisa dibuka dari HP kasir maupun komputer di rumah, datanya selalu sama (real-time).
- Menyimpan riwayat transaksi per pelanggan secara rapi dan bisa dicari kapan saja.
- Memudahkan menagih lewat WhatsApp dengan format struk yang rapi, tinggal kirim.
- Tetap terasa seperti aplikasi kasir sungguhan berkat tampilan bergaya "kertas nota".

---

## ✨ Fitur Utama

### Autentikasi & Multi-Pengguna
- 🔐 Login, pendaftaran akun, dan reset password menggunakan Supabase Auth (email & password).
- 👤 Setiap akun hanya bisa melihat dan mengubah datanya sendiri (dipisahkan lewat `user_id` + Row Level Security).

### Pencatatan Hutang
- 👥 Data pelanggan: nama, nomor telepon, dan saldo hutang berjalan.
- 🧾 Catatan hutang per barang — nama barang, jumlah (qty), harga satuan (otomatis dihitung total bila qty ≥ 2), dan tanggal transaksi.
- 🧑‍💼 Pencatatan **kasir/petugas** yang mencatat transaksi, dengan riwayat yang bisa dikelompokkan per kasir untuk memudahkan rekap harian.
- ➕ **Tambah hutang massal (bulk)** — input beberapa barang sekaligus untuk satu pelanggan dalam satu transaksi.
- 🗂️ Dua mode tampilan di beranda: tab **Kasir** (rekap transaksi per kasir/waktu) dan tab **Pelanggan** (daftar per pelanggan).

### Pembayaran & Saldo
- 💰 Pembayaran hutang, baik **cicilan (sebagian)** maupun **lunas sekaligus**.
- 🙋 Pencatatan nama penerima pembayaran (siapa yang menerima uang saat itu).
- 💳 **Saldo lebih (kredit) otomatis** — kalau pelanggan membayar melebihi tagihan yang berjalan, kelebihannya otomatis tersimpan sebagai saldo dan bisa dipakai untuk menutup hutang berikutnya, tanpa perlu dicatat manual.
- ✅ Status hutang terbagi jelas: **Berjalan** vs **Selesai/Lunas**, lengkap dengan penghitung (badge jumlah) di setiap tab.

### Pencarian & Navigasi
- 🔎 Pencarian pelanggan berdasarkan nama atau nomor telepon.
- ↕️ Pengurutan (terbaru, nama, sisa hutang terbesar, dll.) dan filter berdasarkan status (semua / berjalan / lunas).

### Berbagi & Tagihan
- 💬 **Bagikan rincian hutang lewat WhatsApp** dalam format struk (font monospace bergaya kasir/nota) — tinggal klik dan pesan otomatis terisi rapi, siap dikirim ke nomor pelanggan.
- 📤 Dukungan Web Share API sebagai alternatif berbagi di perangkat yang mendukungnya.

### Pengalaman Aplikasi
- 🌓 **Tema Terang & Gelap** — otomatis mengikuti preferensi sistem saat pertama kali dibuka, lalu bisa diganti manual dan tersimpan di perangkat.
- 📱 **Progressive Web App (PWA)** — bisa dipasang ke layar utama HP layaknya aplikasi native, tetap ringan dibuka, dan **otomatis memperbarui diri** ke versi terbaru setiap kali ada pembaruan (tanpa perlu uninstall/install ulang).
- 🔄 **Sinkronisasi real-time** — perubahan data dari satu perangkat langsung muncul di perangkat lain yang login dengan akun sama, tanpa perlu refresh manual.
- 📊 Analitik pemakaian melalui Vercel Analytics.

---

## 🗺️ Cuplikan Alur Penggunaan

1. Kasir login ke aplikasi dari HP toko.
2. Pelanggan berhutang → kasir menambahkan pelanggan baru (jika belum ada), lalu mencatat barang, jumlah, dan harga.
3. Saat pelanggan membayar (penuh/cicilan), kasir membuka detail pelanggan tersebut dan mencatat pembayaran beserta siapa yang menerima uangnya.
4. Jika ingin menagih dari jarak jauh, kasir cukup menekan tombol **Bagikan via WhatsApp** — rincian hutang berformat rapi otomatis terkirim ke nomor pelanggan.
5. Pemilik toko bisa memantau seluruh transaksi dari komputer di rumah; datanya sama persis karena tersinkron secara real-time.

---

## 🧰 Tumpukan Teknologi

| Teknologi | Kegunaan |
| --- | --- |
| [Next.js 14](https://nextjs.org/) (App Router) | Framework React untuk frontend & routing |
| [Supabase](https://supabase.com/) | Database Postgres, Auth, dan Realtime subscription |
| [Tailwind CSS](https://tailwindcss.com/) | Styling utility-first |
| [Vercel Analytics](https://vercel.com/analytics) | Analitik pemakaian aplikasi |
| Service Worker (native) | Dukungan PWA & caching offline |

---

## 🗂️ Struktur Project

```text
app/
├── page.jsx                  # Halaman utama: daftar pelanggan, kasir, hutang, pembayaran
├── layout.jsx                 # Root layout, metadata PWA, font, footer, analytics
├── globals.css                 # Style global & variabel tema (light/dark)
├── ThemeSwitcher.jsx           # Tombol pengubah tema terang/gelap
├── RegisterSW.jsx              # Registrasi & auto-update service worker (PWA)
├── login/page.jsx              # Halaman masuk
├── signup/page.jsx             # Halaman pendaftaran akun
├── forgot-password/page.jsx    # Permintaan reset password
└── reset-password/page.jsx     # Pengaturan password baru
lib/
└── supabaseClient.js           # Inisialisasi client Supabase
public/
├── manifest.json               # Konfigurasi PWA (nama, ikon, warna tema)
├── sw.js                       # Service worker (cache app shell, auto-update)
└── icon-*.png                  # Ikon aplikasi berbagai ukuran
```

---

## 🧰 Persyaratan

- Node.js (disarankan versi 18 ke atas) dan npm
- Akun & project [Supabase](https://supabase.com/) (gratis)
- Akun [Vercel](https://vercel.com/) jika ingin deploy ke production

---

## 🗄️ Konfigurasi Supabase

Skema database dikelola langsung dari dashboard Supabase (tidak ada file migrasi di repo ini). Buat tabel-tabel berikut:

| Tabel | Kegunaan |
| --- | --- |
| `customers` | Data pelanggan (nama, nomor telepon) |
| `debt_items` | Catatan hutang per barang (nama barang, qty, harga, tanggal, kasir) |
| `payments` | Riwayat pembayaran hutang |
| `credit_transactions` | Riwayat saldo lebih/kredit pelanggan |

> ⚠️ Setiap tabel **wajib** memiliki kolom `user_id` untuk memisahkan data antar akun. Aktifkan **Row Level Security (RLS)** di semua tabel dan buat policy agar pengguna hanya bisa membaca, menambah, mengubah, dan menghapus baris miliknya sendiri (`user_id = auth.uid()`).

### 🔑 Authentication

Di **Supabase Dashboard**:

1. Buka **Authentication → Providers**, aktifkan provider **Email**.
2. Aktifkan/nonaktifkan konfirmasi email sesuai kebutuhan aplikasi.
3. Buat akun lewat halaman `/signup` aplikasi, atau langsung dari menu **Authentication → Users**.
4. Buka **Authentication → URL Configuration**, lalu tambahkan URL berikut ke **Redirect URLs**:
   - `http://localhost:3000/reset-password` — untuk development
   - `https://domain-anda.com/reset-password` — untuk production

### 🔄 Realtime

Aktifkan **Realtime** untuk tabel `customers`, `debt_items`, `payments`, dan `credit_transactions`. Tanpa ini aplikasi tetap berjalan normal, hanya saja perubahan dari perangkat lain tidak langsung muncul (perlu refresh manual).

---

## 💻 Instalasi & Menjalankan Secara Lokal

**1. Clone repository dan install dependency**

```bash
git clone https://github.com/tirsasaki/bukuhutang.git
cd bukuhutang
npm install
```

**2. Siapkan environment variable**

```bash
cp .env.local.example .env.local
```

Isi `.env.local` dengan nilai dari **Supabase Dashboard → Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dengan_anon_public_key_anda
```

**3. Jalankan development server**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu daftar akun baru atau masuk dengan akun yang sudah ada.

---

## 🛠️ Script npm

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan development server |
| `npm run build` | Membuat production build |
| `npm run start` | Menjalankan hasil production build |
| `npm run lint` | Memeriksa kualitas kode dengan ESLint |

---

## ☁️ Deploy ke Vercel

1. Push project ke repository GitHub.
2. Import repository tersebut di [Vercel](https://vercel.com/new).
3. Tambahkan environment variables berikut di pengaturan project Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**.
5. Tambahkan URL production beserta `/reset-password`-nya ke **Redirect URLs** di Supabase (lihat bagian [Authentication](#-authentication) di atas).

Setiap push baru ke branch yang terhubung akan otomatis memicu deployment baru. Karena aplikasi ini adalah PWA dengan auto-update service worker, pengguna yang sudah memasang aplikasi di HP-nya akan otomatis mendapat versi terbaru begitu membuka aplikasi kembali.

---

## 📱 Penggunaan di Banyak Perangkat

1. Buka URL production dari HP kasir, komputer toko, atau perangkat lain.
2. Masuk dengan akun yang sudah terdaftar, atau buat akun baru lewat `/signup`.
3. Untuk pengalaman seperti aplikasi native, gunakan fitur **"Add to Home Screen"** / **"Install App"** dari browser (Chrome, Safari, dll).
4. Data antar pengguna dipisahkan oleh `user_id` dan policy RLS Supabase — setiap akun hanya melihat datanya sendiri. Uji dengan dua akun berbeda untuk memastikan pemisahan data berjalan benar.

---

## 🔒 Keamanan

- Jangan pernah commit atau membagikan file `.env.local`.
- Jangan menonaktifkan RLS pada tabel-tabel aplikasi.
- Anon key memang aman dipakai di sisi browser, tapi akses ke data tetap harus dibatasi lewat policy RLS di setiap tabel.
- Jangan pernah menaruh **service role key** Supabase di frontend atau di variabel environment yang diawali `NEXT_PUBLIC_` — key tersebut hanya boleh dipakai di server/backend.

---

## 🩺 Troubleshooting

**Login atau data gagal dimuat**
Periksa kembali `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`. Pastikan juga tabel, kolom `user_id`, policy RLS, dan akun Supabase sudah dikonfigurasi dengan benar.

**Data tidak sinkron antar perangkat**
Pastikan fitur **Realtime** sudah aktif untuk keempat tabel aplikasi (`customers`, `debt_items`, `payments`, `credit_transactions`) dan koneksi internet tersedia di kedua perangkat.

**Reset password tidak kembali ke aplikasi**
Pastikan URL `/reset-password` untuk localhost maupun production sudah terdaftar di **Supabase → Authentication → URL Configuration → Redirect URLs**.

**Halaman blank / kosong setelah deploy**
Periksa environment variables di pengaturan project Vercel, lalu buka log build/deployment untuk melihat detail error.

**Tampilan PWA terjebak di versi lama**
Aplikasi sudah didesain untuk auto-update lewat service worker. Jika masih terjebak versi lama, tutup semua tab/aplikasi lalu buka kembali — service worker baru akan otomatis mengambil alih dan memuat ulang halaman satu kali.

---

## 🤝 Kontribusi

Saat ini project dikembangkan dan dikelola langsung oleh [tirsasaki](https://github.com/tirsasaki). Jika menemukan bug atau punya ide fitur, silakan buka **Issue** di repository ini.

---

## 📄 Lisensi

Belum ditentukan lisensinya secara resmi — silakan hubungi pemilik repository sebelum menggunakan ulang kode ini untuk keperluan lain di luar pembelajaran pribadi.
