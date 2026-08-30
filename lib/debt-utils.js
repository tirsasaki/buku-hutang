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
