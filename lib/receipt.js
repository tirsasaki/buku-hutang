// Fungsi terkait struk tagihan (format teks & aksi bagikan). Semuanya
// menerima data sebagai parameter (bukan lewat state/closure React), jadi
// aman dipakai di komponen mana pun.

import { formatRupiah, remainingOf, normalizePhone } from "./debt-utils";

// Format struk kasir klasik: kode singkat & rata kolom ala mesin kasir,
// bukan kalimat panjang. Semua produk yang belum dibayar tetap ditampilkan,
// tapi nomor invoice yang dicantumkan cukup 1 saja (yang paling lama) supaya
// tidak membingungkan. Menghasilkan teks struk polos (tanpa pembungkus
// khusus WhatsApp) sehingga bisa dipakai ulang untuk Web Share API, salin
// teks, maupun format lain di luar WhatsApp.
export function buildReceiptBody(cust, debtItems) {
  const unpaidItems = debtItems
    .filter((i) => i.customer_id === cust.id && remainingOf(i) > 0)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (unpaidItems.length === 0) return null;

  const WIDTH = 28;
  const divider = "-".repeat(WIDTH);
  const doubleLine = "=".repeat(WIDTH);
  const padRight = (label, value) => {
    const gap = Math.max(WIDTH - label.length - value.length, 1);
    return label + " ".repeat(gap) + value;
  };

  const oldestInvoiceNo = unpaidItems[0].invoice_no || "-";

  // Kelompokkan item per tanggal pesanan (bukan tanggal cetak), supaya
  // pelanggan bisa melihat barang mana dibeli tanggal berapa.
  const groups = [];
  unpaidItems.forEach((it) => {
    const dateStr = new Date(it.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
    let group = groups.find((g) => g.dateStr === dateStr);
    if (!group) {
      group = { dateStr, items: [] };
      groups.push(group);
    }
    group.items.push(it);
  });

  const groupBlocks = groups.map((g) => {
    const lines = g.items.map((it) => {
      const qty = it.qty || 1;
      const rem = remainingOf(it);
      const unitPrice = Math.round(rem / qty);
      const name = (it.item || "Barang").toUpperCase();
      const qtyPriceStr = "  " + qty + " x " + unitPrice.toLocaleString("id-ID");
      const totalStr = rem.toLocaleString("id-ID");
      return name + "\n" + padRight(qtyPriceStr, totalStr);
    });
    return "*TGL  : " + g.dateStr + "*\n" + lines.join("\n");
  });

  const total = unpaidItems.reduce((s, it) => s + remainingOf(it), 0);

  return (
    "STRUK TAGIHAN\n" +
    doubleLine + "\n" +
    "INV  : " + oldestInvoiceNo + "\n" +
    "NAMA : " + (cust.name || "-") + "\n" +
    divider + "\n" +
    groupBlocks.join("\n\n") + "\n" +
    divider + "\n" +
    padRight("TOTAL", formatRupiah(total)) + "\n" +
    "STATUS: BELUM LUNAS\n" +
    doubleLine
  );
}

// Dibungkus ``` agar WhatsApp merendernya sebagai font monospace (tampilan
// seperti struk cetak asli). Khusus dipakai untuk link wa.me karena hanya
// WhatsApp yang mendukung format ini.
export function buildWaMessage(cust, debtItems) {
  const body = buildReceiptBody(cust, debtItems);
  if (!body) return null;
  return "```\n" + body + "\n```";
}

export function shareReceiptToWa(cust, debtItems) {
  const message = buildWaMessage(cust, debtItems);
  if (!message) {
    alert("Pelanggan ini tidak memiliki hutang aktif untuk dibagikan.");
    return;
  }
  const encoded = encodeURIComponent(message);
  const url =
    cust.phone && cust.phone.trim()
      ? "https://wa.me/" + normalizePhone(cust.phone) + "?text=" + encoded
      : "https://api.whatsapp.com/send?text=" + encoded;
  window.open(url, "_blank");
}

// Membuka menu share bawaan HP (Web Share API) sehingga pengguna bisa
// memilih WhatsApp, Instagram, Telegram, SMS, Email, atau aplikasi lain
// yang terpasang. Kalau browser tidak mendukung (mis. di desktop), otomatis
// fallback ke link WhatsApp seperti sebelumnya.
export async function shareReceipt(cust, debtItems) {
  const body = buildReceiptBody(cust, debtItems);
  if (!body) {
    alert("Pelanggan ini tidak memiliki hutang aktif untuk dibagikan.");
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Struk Tagihan - " + (cust.name || ""),
        text: body,
      });
    } catch (err) {
      // AbortError = pengguna membatalkan share, tidak perlu fallback
      if (err && err.name !== "AbortError") {
        shareReceiptToWa(cust, debtItems);
      }
    }
  } else {
    // Browser tanpa dukungan Web Share API (umumnya desktop)
    shareReceiptToWa(cust, debtItems);
  }
}

// Menyalin teks struk ke clipboard, berguna untuk ditempel manual ke
// aplikasi apa pun (medsos, catatan, email, dll).
export async function copyReceiptText(cust, debtItems) {
  const body = buildReceiptBody(cust, debtItems);
  if (!body) {
    alert("Pelanggan ini tidak memiliki hutang aktif untuk dibagikan.");
    return;
  }
  try {
    await navigator.clipboard.writeText(body);
    alert("Teks tagihan berhasil disalin.");
  } catch (err) {
    alert("Gagal menyalin teks. Coba lagi.");
  }
}
