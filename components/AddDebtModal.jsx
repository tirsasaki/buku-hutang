"use client";

import { useState } from "react";
import { formatThousands, stripThousands } from "../lib/debt-utils";

// Modal "Tambah hutang baru": form satu barang untuk pelanggan yang sedang
// dibuka di halaman detail. Memegang state form sendiri (nama barang, qty,
// harga per item, total harga, tanggal, kasir) beserta sinkronisasi
// qty <-> harga per item <-> total harga (logikanya sama persis dengan
// yang dipakai di BulkDebtModal, tapi untuk satu baris saja).
//
// Modal ini tidak menyentuh Supabase / nomor invoice. Saat submit valid,
// ia memanggil onConfirm(payload) dan membiarkan pemanggil (page.jsx) yang
// mengurus getNextInvoiceNo, insert ke debt_items, dan fetchAll().
//
// Props:
// - kasirNames: daftar nama kasir untuk pilihan cepat
// - onConfirm(payload): dipanggil saat submit valid, payload = { item, qty, amount, date, kasir }
// - onClose(): dipanggil saat modal dibatalkan
export default function AddDebtModal({ kasirNames, onConfirm, onClose }) {
  const [item, setItem] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [kasir, setKasir] = useState("");
  const [amountError, setAmountError] = useState(false);

  // Sinkronisasi qty, harga per item, & total harga:
  // qty = 1 -> harga per item nonaktif, ikut total harga (1:1)
  // qty >= 2 -> harga per item aktif, total harga dihitung otomatis (qty x harga per item)
  function handleQtyChange(value) {
    const q = parseInt(value) || 1;
    setQty(value);
    if (q <= 1) {
      setUnitPrice(amount);
    } else {
      const unit = parseFloat(unitPrice) || 0;
      if (unit) setAmount(String(unit * q));
    }
  }

  function handleUnitPriceChange(value) {
    setUnitPrice(value);
    const q = parseInt(qty) || 1;
    const unit = parseFloat(value) || 0;
    setAmount(value === "" ? "" : String(unit * q));
  }

  function handleAmountChange(value) {
    setAmount(value);
    const q = parseInt(qty) || 1;
    if (q <= 1) setUnitPrice(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setAmountError(true);
      return;
    }
    setAmountError(false);

    await onConfirm({
      item,
      qty,
      amount: amt,
      date: date || new Date().toISOString().split("T")[0],
      kasir,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-3">Tambah hutang baru</h2>
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Barang</label>
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Contoh: Beras 5kg"
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Qty (pcs)</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => handleQtyChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Harga per item (Rp)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatThousands(unitPrice)}
            disabled={(parseInt(qty) || 1) <= 1}
            onChange={(e) => handleUnitPriceChange(stripThousands(e.target.value))}
            placeholder={(parseInt(qty) || 1) <= 1 ? "Otomatis (qty 1)" : ""}
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
              (parseInt(qty) || 1) <= 1
                ? "border-[var(--paper-line)] bg-[var(--paper-line)]/40 text-[var(--ink-soft)] cursor-not-allowed"
                : "border-[var(--paper-line)] bg-[var(--paper)] focus:border-[var(--gold)]"
            }`}
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Total harga (Rp)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatThousands(amount)}
            disabled={(parseInt(qty) || 1) > 1}
            onChange={(e) => handleAmountChange(stripThousands(e.target.value))}
            placeholder={(parseInt(qty) || 1) > 1 ? "Otomatis (qty x harga per item)" : ""}
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
              (parseInt(qty) || 1) > 1
                ? "border-[var(--paper-line)] bg-[var(--paper-line)]/40 text-[var(--ink-soft)] cursor-not-allowed"
                : "border-[var(--paper-line)] bg-[var(--paper)] focus:border-[var(--gold)]"
            }`}
          />
          {amountError && <div className="text-xs text-[var(--red)] mt-1">Masukkan jumlah yang benar</div>}
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Kasir (opsional)</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {kasirNames.map((name) => (
              <div
                key={name}
                onClick={() => setKasir(name)}
                className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${kasir === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
              >
                {name}
              </div>
            ))}
          </div>
          <input
            value={kasir}
            onChange={(e) => setKasir(e.target.value)}
            placeholder="Atau ketik nama kasir"
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
            Batal
          </button>
          <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
