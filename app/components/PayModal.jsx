import { creditBalanceForCustomer, formatRupiah, remainingOf } from "../../lib/ledgerUtils";

export default function PayModal({
  payTarget,
  payMode,
  debtItems,
  selectedCustomerId,
  creditTx,
  payAmount,
  payAmountError,
  receiver,
  receiverOther,
  receiverError,
  onPayAmountChange,
  onReceiverChange,
  onReceiverOtherChange,
  onCancel,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={onSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-1">{payTarget === "ALL" || Array.isArray(payTarget) ? "Tandai lunas" : payMode === "lunas" ? "Tandai lunas" : "Bayar sebagian"}</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-3">
          {payTarget === "ALL" || Array.isArray(payTarget) ? (
            (() => {
              const items =
                payTarget === "ALL"
                  ? debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
                  : payTarget.filter((i) => remainingOf(i) > 0);
              const total = items.reduce((s, i) => s + remainingOf(i), 0);
              return `${items.length} barang, total tagihan ${formatRupiah(total)}. Semua akan ditandai lunas penuh.`;
            })()
          ) : (
            <>
              Sisa hutang {payTarget.item || ""}: {formatRupiah(remainingOf(payTarget))}
              {payMode === "lunas" ? " — akan ditandai lunas penuh." : ""}
            </>
          )}
        </p>
        {creditBalanceForCustomer(selectedCustomerId, creditTx) > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--gold-soft)] text-xs text-[var(--gold)] border border-[var(--gold)]/30">
            Pelanggan ini punya saldo lebih {formatRupiah(creditBalanceForCustomer(selectedCustomerId, creditTx))}. Tutup form ini lalu tekan &ldquo;Pakai saldo lebih&rdquo; di halaman pelanggan untuk memakainya.
          </div>
        )}
        {(() => {
          const isGroup = payTarget === "ALL" || Array.isArray(payTarget);
          const groupItems = isGroup
            ? payTarget === "ALL"
              ? debtItems.filter((i) => i.customer_id === selectedCustomerId && remainingOf(i) > 0)
              : payTarget.filter((i) => remainingOf(i) > 0)
            : null;
          const minRequired = isGroup
            ? groupItems.reduce((s, i) => s + remainingOf(i), 0)
            : payMode === "lunas"
            ? remainingOf(payTarget)
            : 0;
          const amt = parseFloat(payAmount);
          const overpay = !isNaN(amt) && amt > minRequired ? amt - minRequired : 0;
          return (
            <div className="mb-3">
              <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">
                {isGroup || payMode === "lunas" ? "Uang diterima (Rp)" : "Jumlah dibayar (Rp)"}
              </label>
              <input
                type="number"
                min="0"
                value={payAmount}
                onChange={(event) => onPayAmountChange(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
              />
              {payAmountError && (
                <div className="text-xs text-[var(--red)] mt-1">
                  {isGroup || payMode === "lunas"
                    ? `Untuk menandai lunas, jumlah minimal ${formatRupiah(minRequired)}. Untuk bayar kurang dari itu, gunakan "Bayar sebagian".`
                    : "Masukkan jumlah pembayaran yang benar"}
                </div>
              )}
              {overpay > 0 && (
                <div className="text-xs text-[var(--gold)] mt-1">
                  Kelebihan {formatRupiah(overpay)} akan disimpan sebagai saldo lebih.
                </div>
              )}
            </div>
          );
        })()}
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Siapa yang menerima uangnya?</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {["Saya", "Fuji", "Ibu"].map((name) => (
              <div
                key={name}
                onClick={() => onReceiverChange(name)}
                className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${receiver === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
              >
                {name}
              </div>
            ))}
          </div>
          <input
            value={receiverOther}
            onChange={(event) => onReceiverOtherChange(event.target.value)}
            placeholder="Atau ketik nama lain"
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm mt-2 outline-none focus:border-[var(--gold)] transition-colors"
          />
          {receiverError && <div className="text-xs text-[var(--red)] mt-1">Pilih atau isi nama penerima</div>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
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
