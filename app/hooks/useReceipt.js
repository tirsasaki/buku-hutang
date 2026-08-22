"use client";

import { formatRupiah, normalizePhone, remainingOf } from "../../lib/ledgerUtils";

export default function useReceipt({ debtItems }) {
  function buildReceiptBody(cust) {
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
    const todayStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });

    const itemLines = unpaidItems.map((it) => {
      const qty = it.qty || 1;
      const rem = remainingOf(it);
      const unitPrice = Math.round(rem / qty);
      const name = (it.item || "Barang").toUpperCase();
      const qtyPriceStr = "  " + qty + " x " + unitPrice.toLocaleString("id-ID");
      const totalStr = rem.toLocaleString("id-ID");
      return name + "\n" + padRight(qtyPriceStr, totalStr);
    });

    const total = unpaidItems.reduce((s, it) => s + remainingOf(it), 0);

    return (
      "STRUK TAGIHAN\n" +
      doubleLine + "\n" +
      "INV  : " + oldestInvoiceNo + "\n" +
      "NAMA : " + (cust.name || "-") + "\n" +
      "TGL  : " + todayStr + "\n" +
      divider + "\n" +
      itemLines.join("\n") + "\n" +
      divider + "\n" +
      padRight("TOTAL", formatRupiah(total)) + "\n" +
      "STATUS: BELUM LUNAS\n" +
      doubleLine
    );
  }

  function buildWaMessage(cust) {
    const body = buildReceiptBody(cust);
    if (!body) return null;
    return "```\n" + body + "\n```";
  }

  function handleShareWa(cust) {
    const message = buildWaMessage(cust);
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

  async function handleShare(cust) {
    const body = buildReceiptBody(cust);
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
        if (err && err.name !== "AbortError") {
          handleShareWa(cust);
        }
      }
    } else {
      handleShareWa(cust);
    }
  }

  async function handleCopyText(cust) {
    const body = buildReceiptBody(cust);
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

  return { buildReceiptBody, buildWaMessage, handleShareWa, handleShare, handleCopyText };
}
