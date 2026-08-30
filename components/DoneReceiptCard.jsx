"use client";

import { formatRupiah } from "../lib/debt-utils";

// Kartu bergaya "struk pembayaran" untuk satu grup transaksi yang sudah
// lunas (dikelompokkan berdasarkan momen pembayaran — lihat komentar
// pengelompokan di DebtHistoryTabs.jsx). Murni presentasional, semua
// perhitungan sudah dilakukan oleh pemanggil dan diterima lewat `group`.
//
// Props:
// - group: { key, lunasDateStr, receivedBy, invoiceNoDisplay, items, groupTotal }
export default function DoneReceiptCard({ group }) {
  return (
    <div className="font-mono-num bg-[var(--card)] border border-dashed border-[var(--paper-line)] rounded-lg shadow-sm overflow-hidden">
      {/* Kepala struk: nomor invoice, tanggal selesai & nama kasir */}
      <div className="px-3.5 pt-3.5 pb-2.5 text-center border-b border-dashed border-[var(--paper-line)]">
        <div className="text-[10px] tracking-[0.25em] text-[var(--ink-soft)] uppercase">Struk Pembayaran</div>
        <div className="text-xs font-semibold mt-1.5">{group.invoiceNoDisplay}</div>
        <div className="text-sm font-semibold mt-0.5">{group.lunasDateStr}</div>
        <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">
          Kasir: {group.receivedBy || "-"}
        </div>
      </div>

      {/* Isi struk: nama produk x jumlah & harga */}
      <div className="px-3.5 py-2.5 space-y-1.5">
        {group.items.map((it) => (
          <div key={it.id} className="flex items-baseline justify-between gap-3">
            <span className="text-xs leading-relaxed">
              {it.item || "Hutang"} <span className="text-[var(--ink-soft)]">x{it.qty || 1}</span>
            </span>
            <span className="text-xs whitespace-nowrap">{formatRupiah(it.amount)}</span>
          </div>
        ))}
      </div>

      {/* Total struk */}
      <div className="px-3.5 py-2.5 border-t border-dashed border-[var(--paper-line)] flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
        <span className="text-base font-bold text-[var(--green)] whitespace-nowrap">
          {formatRupiah(group.groupTotal)}
        </span>
      </div>

      <div className="px-3.5 pb-3 -mt-0.5 flex justify-center">
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)]">
          Lunas
        </span>
      </div>
    </div>
  );
}
