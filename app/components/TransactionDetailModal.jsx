import { formatRupiah, paidAmountOf, remainingOf } from "../../lib/ledgerUtils";

export default function TransactionDetailModal({ detailGroup, onClose, onPay, onDelete, onMarkGroupPaid }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[var(--card)] px-5 pt-5 pb-4 border-b border-[var(--paper-line)] flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--gold)] uppercase">Belanja (Piutang)</div>
            <div className="font-ledger text-lg mt-0.5 font-mono-num">{detailGroup.trxNo}</div>
            <div className="text-xs text-[var(--ink-soft)] mt-1">
              {new Date(detailGroup.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              {" · "}Kasir: {detailGroup.kasir || "-"}
            </div>
          </div>
          <div onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--paper-line)] flex items-center justify-center shrink-0 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="5" y1="5" x2="19" y2="19" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
              <line x1="19" y1="5" x2="5" y2="19" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {detailGroup.items.map((it) => {
            const paid = paidAmountOf(it);
            const remaining = remainingOf(it);
            const pct = it.amount > 0 ? Math.min(100, Math.round((paid / it.amount) * 100)) : 100;
            const sortedPayments = (it.payments || []).slice().sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
            return (
              <div key={it.id} className="rounded-2xl border border-[var(--paper-line)] p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{it.item || "Hutang"}</span>
                  <span className="text-xs text-[var(--ink-soft)] whitespace-nowrap">{it.qty || 1} pcs</span>
                </div>
                <div className="text-xs text-[var(--ink-soft)] mt-1">Total: {formatRupiah(it.amount)}</div>
                <div className="h-1.5 rounded-full bg-[var(--red-soft)] mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--green)]" style={{ width: pct + "%" }} />
                </div>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-xs text-[var(--ink-soft)]">Sisa</span>
                  <span className="font-mono-num text-base font-semibold text-[var(--red)]">
                    {formatRupiah(Math.max(remaining, 0))}
                  </span>
                </div>
                {paid > 0 && (
                  <div className="text-xs text-[var(--green)] mt-1">Sudah dibayar sebagian {formatRupiah(paid)}</div>
                )}
                <div className="flex gap-2 mt-2.5">
                  <button onClick={() => onPay(it, "partial")} className="flex-1 py-1.5 rounded-lg border border-[var(--paper-line)] text-xs font-medium">
                    Bayar sebagian
                  </button>
                  <button onClick={() => onPay(it, "lunas")} className="flex-1 py-1.5 rounded-lg bg-[var(--green)] text-white text-xs font-medium">
                    Tandai lunas
                  </button>
                </div>
                {sortedPayments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-[var(--paper-line)]">
                    <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-wide mb-1">Riwayat bayar sebagian</div>
                    {sortedPayments.map((p) => (
                      <div key={p.id} className="text-[11.5px] text-[var(--ink-soft)] mt-0.5">
                        {formatRupiah(p.amount)} &middot; diterima oleh {p.received_by} &middot; tanggal{" "}
                        {new Date(p.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    ))}
                  </div>
                )}
                <div onClick={() => onDelete(it.id)} className="text-[11px] text-[var(--ink-soft)] underline cursor-pointer mt-2 inline-block">
                  Hapus barang ini
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-[var(--paper-line)] sticky bottom-0 bg-[var(--card)]">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-xs text-[var(--ink-soft)] uppercase tracking-wide">Total transaksi</span>
            <span className="font-mono-num text-xl font-bold">
              {formatRupiah(detailGroup.items.reduce((s, it) => s + Number(it.amount || 0), 0))}
            </span>
          </div>
          <button onClick={() => onMarkGroupPaid(detailGroup.items)} className="w-full py-2.5 rounded-xl bg-[var(--green)] text-white text-sm font-semibold">
            Tandai transaksi ini lunas
          </button>
        </div>
      </div>
    </div>
  );
}
