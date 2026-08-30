"use client";

// Util notifikasi kesalahan yang seragam untuk seluruh aplikasi. Untuk saat
// ini pakai alert() browser bawaan sebagai baseline paling sederhana --
// cukup supaya user tahu ada aksi yang gagal, tanpa perlu membangun sistem
// toast/snackbar dulu. Dipusatkan di satu fungsi supaya kalau nanti mau
// upgrade ke komponen toast custom, cukup diubah di satu tempat ini saja,
// tidak perlu menyentuh tiap pemanggil satu per satu.
export function notifyError(message) {
  alert(message);
}
