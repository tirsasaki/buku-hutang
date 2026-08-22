import { creditBalanceForCustomer, formatRupiah, remainingOf } from "../../lib/ledgerUtils";

export default function UseCreditModal({
  selectedCustomer,
  debtItems,
  creditTx,
  useCreditReceiver,
  useCreditReceiverOther,
  useCreditReceiverError,
  onReceiverChange,
  onReceiverOtherChange,
  onCancel,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={onSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-1">Pakai saldo lebih</h2>
        {(() => {
          const available = creditBalanceForCustomer(selectedCustomer.id, creditTx);
          const items = debtItems
            .filter((i) => i.customer_id === selectedCustomer.id && remainingOf(i) > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          const totalDebt = items.reduce((s, i) => s + remainingOf(i), 0);
          const willUse = Math.min(available, totalDebt);
          const leftoverCredit = available - willUse;
          return (
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Saldo lebih tersedia: {formatRupiah(available)}. Akan dipakai {formatRupiah(willUse)} untuk
              melunasi hutang paling lama terlebih dahulu.
              {leftoverCredit > 0 && ` Sisa saldo setelahnya: ${formatRupiah(leftoverCredit)}.`}
            </p>
          );
        })()}
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Siapa yang memproses ini?</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {["Saya", "Fuji", "Ibu"].map((name) => (
              <div
                key={name}
                onClick={() => onReceiverChange(name)}
                className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${useCreditReceiver === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}
              >
                {name}
              </div>
            ))}
          </div>
          <input
            value={useCreditReceiverOther}
            onChange={(event) => onReceiverOtherChange(event.target.value)}
            placeholder="Atau ketik nama lain"
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm mt-2 outline-none focus:border-[var(--gold)] transition-colors"
          />
          {useCreditReceiverError && <div className="text-xs text-[var(--red)] mt-1">Pilih atau isi nama yang memproses</div>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
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
