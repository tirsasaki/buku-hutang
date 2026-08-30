"use client";

import { useState } from "react";
import {
  formatRupiah,
  formatThousands,
  stripThousands,
  remainingOf,
  allocateOldestFirst,
} from "../lib/debt-utils";

// Modal "Bayar sebagian" tingkat pelanggan: satu jumlah uang dibayarkan lalu
// otomatis dipakai untuk melunasi hutang yang PALING LAMA lebih dulu
// (invoice/tanggal terlama duluan), sama seperti alur "Pakai saldo lebih".
// Kalau jumlah bayar melebihi total hutang aktif, kelebihannya disimpan
// sebagai saldo lebih pelanggan (konsisten dengan alur pembayaran lain di
// app ini).
//
// Modal ini tidak menyentuh Supabase. Saat form valid & disubmit, ia
// memanggil onConfirm({ amount, receivedBy }) dan membiarkan pemanggil yang
// menjalankan alokasi ke query nyata + fetchAll().
//
// Props:
// - debtItems, selectedCustomerId: dipakai untuk menghitung hutang aktif pelanggan & preview alokasi
// - kasirNames: daftar nama kasir untuk pilihan "penerima"
// - onConfirm({ amount, receivedBy }): dipanggil saat submit valid
// - onClose(): dipanggil saat modal dibatalkan
export default function PartialPaymentModal({ debtItems, selectedCustomerId, kasirNames, onConfirm, onClose }) {
  const activeItems = debtItems
    .filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalDebt = activeItems.reduce((s, i) => s + remainingOf(i), 0);

  const [payAmount, setPayAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [receiverOther, setReceiverOther] = useState("");
  const [payAmountError, setPayAmountError] = useState(false);
  const [receiverError, setReceiverError] = useState(false);

  const amt = parseFloat(payAmount) || 0;
  const { allocations, leftover } = allocateOldestFirst(activeItems, amt);
  const overpayPreview = leftover;

  async function handleSubmit(e) {
    e.preventDefault();
    const finalReceiver = receiverOther.trim() || receiver;
    if (!finalReceiver) {
      setReceiverError(true);
      return;
    }
    setReceiverError(false);

    if (!amt || amt <= 0 || isNaN(amt)) {
      setPayAmountError(true);
      return;
    }
    setPayAmountError(false);

    await onConfirm({ amount: amt, receivedBy: finalReceiver });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-1">Bayar sebagian</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-3">
          Total hutang aktif {formatRupiah(totalDebt)} dari {activeItems.length} barang. Uang yang dibayar akan
          dipakai untuk melunasi hutang paling lama terlebih dahulu.
        </p>

        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Jumlah dibayar (Rp)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatThousands(payAmount)}
            onChange={(e) => setPayAmount(stripThousands(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
          {payAmountError && (
            <div className="text-xs text-[var(--red)] mt-1">Masukkan jumlah pembayaran yang benar</div>
          )}
          {overpayPreview > 0 && (
            <div className="text-xs text-[var(--gold)] mt-1">
              Semua hutang akan lunas. Kelebihan {formatRupiah(overpayPreview)} akan disimpan sebagai saldo lebih.
            </div>
          )}
        </div>

        {amt > 0 && allocations.length > 0 && (
          <div className="mb-3 max-h-36 overflow-y-auto rounded-lg border border-[var(--paper-line)] divide-y divide-[var(--paper-line)]">
            {allocations.map(({ item, amount, fullyPaid }) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                <span className="text-[var(--ink)] truncate pr-2">{item.item || "Barang"}</span>
                <span className={fullyPaid ? "text-[var(--green)]" : "text-[var(--gold)]"}>
                  {formatRupiah(amount)} {fullyPaid ? "(lunas)" : "(sebagian)"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Siapa yang menerima uangnya?</label>
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
          {receiverError && <div className="text-xs text-[var(--red)] mt-1">Pilih atau isi nama penerima</div>}
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
