"use client";

import { useState } from "react";
import { formatRupiah, remainingOf } from "../lib/debt-utils";

// Modal "Pakai saldo lebih untuk bayar hutang": tampilkan preview berapa
// saldo yang akan terpakai (melunasi hutang paling lama dulu), lalu minta
// nama kasir yang memproses. Memegang state form (nama penerima) sendiri.
// Saat submit valid, memanggil onConfirm(receivedBy) — logika pembagian
// saldo ke tiap item hutang tetap jadi tanggung jawab pemanggil (page.jsx),
// karena itu bagian dari alur pembayaran, bukan urusan form.
//
// Props:
// - customer: pelanggan yang sedang dibayar hutangnya
// - availableCredit: saldo lebih pelanggan (angka)
// - debtItems: daftar debt_item mentah milik pelanggan ini (dipakai untuk preview alokasi)
// - kasirNames: daftar nama kasir untuk pilihan cepat
// - onConfirm(receivedBy): dipanggil saat submit valid
// - onClose(): dipanggil saat modal dibatalkan
export default function UseCreditModal({ customer, availableCredit, debtItems, kasirNames, onConfirm, onClose }) {
  const [receiver, setReceiver] = useState("");
  const [receiverOther, setReceiverOther] = useState("");
  const [receiverError, setReceiverError] = useState(false);

  const items = debtItems
    .filter((i) => i.customer_id === customer.id && remainingOf(i) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalDebt = items.reduce((s, i) => s + remainingOf(i), 0);
  const willUse = Math.min(availableCredit, totalDebt);
  const leftoverCredit = availableCredit - willUse;

  async function handleSubmit(e) {
    e.preventDefault();
    const finalReceiver = receiverOther.trim() || receiver;
    if (!finalReceiver) {
      setReceiverError(true);
      return;
    }
    setReceiverError(false);
    await onConfirm(finalReceiver);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-1">Pakai saldo lebih</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-3">
          Saldo lebih tersedia: {formatRupiah(availableCredit)}. Akan dipakai {formatRupiah(willUse)} untuk
          melunasi hutang paling lama terlebih dahulu.
          {leftoverCredit > 0 && ` Sisa saldo setelahnya: ${formatRupiah(leftoverCredit)}.`}
        </p>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Siapa yang memproses ini?</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {kasirNames.map((name) => (
              <div
                key={name}
                onClick={() => {
                  setReceiver(name);
                  setReceiverOther("");
                }}
                className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${receiver === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
              >
                {name}
              </div>
            ))}
          </div>
          <input
            value={receiverOther}
            onChange={(e) => {
              setReceiverOther(e.target.value);
              if (e.target.value.trim()) setReceiver("");
            }}
            placeholder="Atau ketik nama lain"
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm mt-2 outline-none focus:border-[var(--gold)] transition-colors"
          />
          {receiverError && <div className="text-xs text-[var(--red)] mt-1">Pilih atau isi nama yang memproses</div>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
            Batal
          </button>
          <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--gold)] text-white text-sm font-medium">
            Pakai Saldo
          </button>
        </div>
      </form>
    </div>
  );
}
