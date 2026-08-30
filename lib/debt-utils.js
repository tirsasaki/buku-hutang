// Kumpulan fungsi murni (pure function) untuk logika Buku Hutang.
// Tidak ada yang bergantung pada state React atau JSX di sini, jadi aman
// diimpor dari komponen mana pun dan gampang ditest terpisah.

export function formatRupiah(n) {
  return "Rp " + Math.round(n || 0).toLocaleString("id-ID");
}

// Format string angka mentah ("10000") jadi ada titik ribuan ("10.000") untuk ditampilkan di input.
export function formatThousands(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Buang titik ribuan dari input pengguna, sisakan angka mentah untuk disimpan di state.
export function stripThousands(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

export function remainingOf(item) {
  const paid = (item.payments || []).reduce((s, p) => s + Number(p.amount), 0);
  return Number(item.amount) - paid;
}

export function paidAmountOf(item) {
  return (item.payments || []).reduce((s, p) => s + Number(p.amount), 0);
}

// Alokasikan sejumlah uang ke daftar item hutang, item yang tanggalnya
// paling lama dilunasi lebih dulu, sampai uangnya habis atau semua item
// lunas. Dipakai untuk fitur "bayar sebagian" (bayar gabungan lintas item)
// dan "pakai saldo lebih". Item dengan sisa 0 diabaikan; item input tidak
// diubah (fungsi murni, tidak ada efek samping).
//
// Mengembalikan:
// - allocations: [{ item, amount, fullyPaid }, ...] urut dari item paling lama
// - totalUsed: total uang yang terpakai (amount - leftover)
// - leftover: sisa uang setelah semua item aktif lunas (kelebihan bayar)
export function allocateOldestFirst(items, amount) {
  const sorted = [...items]
    .filter((i) => remainingOf(i) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let left = Math.max(Number(amount) || 0, 0);
  const allocations = [];
  for (const it of sorted) {
    if (left <= 0) break;
    const rem = remainingOf(it);
    const use = Math.min(left, rem);
    if (use > 0) {
      allocations.push({ item: it, amount: use, fullyPaid: use >= rem });
      left -= use;
    }
  }
  return { allocations, totalUsed: (Number(amount) || 0) - left, leftover: Math.max(left, 0) };
}

export function normalizePhone(phone) {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}

// Nama kasir bawaan, dipakai jika pengguna belum mengatur nama kasir sendiri
// lewat halaman Profil.
export const DEFAULT_KASIR = ["Saya", "Fuji", "Ibu"];

// Menghasilkan warna khas yang konsisten untuk tiap nama pelanggan (hue tetap
// sama selama nama tidak berubah), agar tetap kontras di tema terang maupun gelap.
export function customerColor(name) {
  const str = (name || "?").trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 45%)`;
}

export function customerInitials(name) {
  const parts = (name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
