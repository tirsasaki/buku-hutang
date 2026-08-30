"use client";

import { useState } from "react";
import { formatRupiah, formatThousands, stripThousands, remainingOf } from "../lib/debt-utils";

// Modal pembayaran: menangani "bayar sebagian" & "tandai lunas" untuk satu
// item, maupun pembayaran gabungan (satu transaksi, atau seluruh hutang
// pelanggan sekaligus lewat target === "ALL"). Modal ini memegang state
// form (jumlah, penerima, error) dan semua kalkulasi tampilan (total
// tagihan, minimal bayar, kelebihan bayar) sendiri.
//
// Modal ini tidak menyentuh Supabase. Saat form valid & disubmit, ia
// memanggil onConfirm(payload) dan membiarkan pemanggil yang menjalankan
// query, efek samping (alert kelebihan bayar), dan fetchAll().
//
// Props:
// - target: item tunggal | "ALL" | array item (satu transaksi/grup)
// - initialMode: "partial" | "lunas" — dipakai hanya saat target item tunggal
// - debtItems, selectedCustomerId: dipakai untuk menghitung item aktif saat target === "ALL"
// - creditBalance: saldo lebih pelanggan (angka), untuk banner info
// - kasirNames: daftar nama kasir untuk pilihan "penerima"
// - onConfirm(payload): dipanggil saat submit valid
// - onClose(): dipanggil saat modal dibatalkan
export default function PaymentModal({
  target,
  initialMode,
  debtItems,
  selectedCustomerId,
  creditBalance,
  kasirNames,
  onConfirm,
  onClose,
}) {
  const isGroup = target === "ALL" || Array.isArray(target);

  const groupItems = isGroup
    ? target === "ALL"
      ? debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
      : target.filter((i) => remainingOf(i) > 0)
    : null;

  // Mode gabungan selalu "lunas" (tandai lunas semua); untuk item tunggal
  // ikuti mode yang dipilih lewat tombol pemicu ("Bayar sebagian" / "Tandai lunas").
  const [payMode] = useState(isGroup ? "lunas" : initialMode);

  const minRequired = isGroup
    ? groupItems.reduce((s, i) => s + remainingOf(i), 0)
    : payMode === "lunas"
    ? remainingOf(target)
    : 0;

  const [payAmount, setPayAmount] = useState(
    isGroup || payMode === "lunas" ? String(Math.round(minRequired)) : ""
  );
  const [receiver, setReceiver] = useState("");
  const [receiverOther, setReceiverOther] = useState("");
  const [payAmountError, setPayAmountError] = useState(false);
  const [receiverError, setReceiverError] = useState(false);

  const amt = parseFloat(payAmount);
  const overpayPreview = !isNaN(amt) && amt > minRequired ? amt - minRequired : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const finalReceiver = receiverOther.trim() || receiver;
    if (!finalReceiver) {
      setReceiverError(true);
      return;
    }
    setReceiverError(false);

    if (isGroup) {
      const amount = parseFloat(payAmount);
      if (!amount || amount <= 0 || isNaN(amount) || amount < minRequired) {
        setPayAmountError(true);
        return;
      }
      setPayAmountError(false);

      await onConfirm({
        isGroup: true,
        items: groupItems,
        amount,
        overpay: amount - minRequired,
        receivedBy: finalReceiver,
      });
      return;
    }

    const remaining = remainingOf(target);
    const amount = parseFloat(payAmount);
    let valid = true;

    if (!amount || amount <= 0 || isNaN(amount)) {
      setPayAmountError(true);
      valid = false;
    } else if (payMode === "lunas" && amount < remaining) {
      // Mode "lunas" wajib menutup penuh sisa hutang; kalau kurang dari itu,
      // pakai tombol "Bayar sebagian" saja.
      setPayAmountError(true);
      valid = false;
    } else {
      setPayAmountError(false);
    }
    if (!valid) return;

    await onConfirm({
      isGroup: false,
      target,
      actualPayment: Math.min(amount, remaining),
      overpay: Math.max(amount - remaining, 0),
      receivedBy: finalReceiver,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-1">
          {isGroup ? "Tandai lunas" : payMode === "lunas" ? "Tandai lunas" : "Bayar sebagian"}
        </h2>
        <p className="text-xs text-[var(--ink-soft)] mb-3">
          {isGroup ? (
            `${groupItems.length} barang, total tagihan ${formatRupiah(minRequired)}. Semua akan ditandai lunas penuh.`
          ) : (
            <>
              Sisa hutang {target.item || ""}: {formatRupiah(remainingOf(target))}
              {payMode === "lunas" ? " — akan ditandai lunas penuh." : ""}
            </>
          )}
        </p>
        {creditBalance > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--gold-soft)] text-xs text-[var(--gold)] border border-[var(--gold)]/30">
            Pelanggan ini punya saldo lebih {formatRupiah(creditBalance)}. Tutup form ini lalu tekan &ldquo;Pakai saldo lebih&rdquo; di halaman pelanggan untuk memakainya.
          </div>
        )}
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">
            {isGroup || payMode === "lunas" ? "Uang diterima (Rp)" : "Jumlah dibayar (Rp)"}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formatThousands(payAmount)}
            onChange={(e) => setPayAmount(stripThousands(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
          {payAmountError && (
            <div className="text-xs text-[var(--red)] mt-1">
              {isGroup || payMode === "lunas"
                ? `Untuk menandai lunas, jumlah minimal ${formatRupiah(minRequired)}. Untuk bayar kurang dari itu, gunakan "Bayar sebagian".`
                : "Masukkan jumlah pembayaran yang benar"}
            </div>
          )}
          {overpayPreview > 0 && (
            <div className="text-xs text-[var(--gold)] mt-1">
              Kelebihan {formatRupiah(overpayPreview)} akan disimpan sebagai saldo lebih.
            </div>
          )}
        </div>
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
