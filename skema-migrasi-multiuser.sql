-- ============================================
-- MIGRASI: DARI 1 AKUN MENJADI MULTI-USER
-- Jalankan ini di SQL Editor Supabase Anda yang SUDAH PUNYA DATA.
-- Jangan gunakan skema-database.sql yang lama lagi setelah ini.
-- ============================================

-- LANGKAH 1: Tambah kolom user_id di 3 tabel (boleh kosong dulu sementara)
alter table customers add column user_id uuid references auth.users(id);
alter table debt_items add column user_id uuid references auth.users(id);
alter table payments add column user_id uuid references auth.users(id);

-- ============================================
-- LANGKAH 2: Isi data lama dengan user_id akun Anda sendiri
-- ============================================
-- Cara dapatkan USER_ID Anda:
-- 1. Buka menu Authentication > Users di dashboard Supabase
-- 2. Klik akun Anda, copy nilai "User UID" (bentuknya seperti: a1b2c3d4-e5f6-...)
-- 3. Ganti tulisan 'GANTI_DENGAN_USER_ID_ANDA' di 3 baris di bawah ini dengan UID tadi
-- 4. Baru jalankan 3 baris update ini

update customers set user_id = 'GANTI_DENGAN_USER_ID_ANDA' where user_id is null;
update debt_items set user_id = 'GANTI_DENGAN_USER_ID_ANDA' where user_id is null;
update payments set user_id = 'GANTI_DENGAN_USER_ID_ANDA' where user_id is null;

-- ============================================
-- LANGKAH 3: Wajibkan kolom user_id selalu terisi untuk data baru
-- ============================================
alter table customers alter column user_id set not null;
alter table debt_items alter column user_id set not null;
alter table payments alter column user_id set not null;

-- Otomatis isi user_id dengan akun yang sedang login, saat data baru ditambahkan
alter table customers alter column user_id set default auth.uid();
alter table debt_items alter column user_id set default auth.uid();
alter table payments alter column user_id set default auth.uid();

-- ============================================
-- LANGKAH 4: Ganti aturan keamanan lama dengan yang baru
-- (lama: "asal login boleh lihat semua" -> baru: "hanya boleh lihat punya sendiri")
-- ============================================
drop policy if exists "allow all for authenticated users" on customers;
drop policy if exists "allow all for authenticated users" on debt_items;
drop policy if exists "allow all for authenticated users" on payments;

create policy "user can only access own customers" on customers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user can only access own debt_items" on debt_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user can only access own payments" on payments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- SELESAI. Cek hasilnya:
-- Table Editor > customers > kolom user_id harus terisi semua (tidak ada yang kosong)
-- ============================================
