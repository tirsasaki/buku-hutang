"use client";

import { formatRupiah, paidAmountOf } from "../lib/debt-utils";

// Catatan: satu "row" di sini mewakili satu TRANSAKSI (grup barang yang
// diinput bersamaan — invoice_no atau tanggal+kasir yang sama), bukan satu
// baris per barang. Itu supaya beberapa barang yang diambil dalam satu kali
// belanja tetap tampil sebagai satu kartu, sesuai perilaku aslinya di
// page.jsx. Dipakai di tab "Berjalan" pada halaman detail pelanggan.
//
// Komponen ini murni presentasional: semua kalkulasi (total, sisa tagihan,
// status cicilan) dihitung dari `group` yang diterima, dan klik kartu cukup
// memanggil onClick() — pemanggil (page.jsx) yang menentukan apa yang terjadi
// (buka modal detail transaksi).
//
// Props:
// - group: { key, date, kasir, trxNo, items: [...] }
// - onClick(): dipanggil saat kartu diklik
export default function DebtItemRow({ group, onClick }) {
  const groupTotal = group.items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const groupPaid = group.items.reduce((s, it) => s + paidAmountOf(it), 0);
  const groupRemaining = groupTotal - groupPaid;
  const isPartial = groupPaid > 0;
  const dateStr = new Date(group.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      onClick={onClick}
      className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--paper-line)] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16l-1.4 11.3a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7L4 7Z" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Belanja (Piutang)</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">
              {group.items.length} barang &middot; {dateStr}
            </div>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-1.5">
          <path d="M9 6l6 6-6 6" stroke="var(--ink-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-y-1.5 mt-3 text-xs">
        <div className="text-[var(--ink-soft)]">No. Invoice</div>
        <div className="text-right font-mono-num">{group.trxNo}</div>
        <div className="text-[var(--ink-soft)]">Kasir</div>
        <div className="text-right">{group.kasir || "-"}</div>
      </div>

      <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-dashed border-[var(--paper-line)]">
        <span className="text-xs text-[var(--ink-soft)]">{isPartial ? "Sisa tagihan" : "Total transaksi"}</span>
        <span className="font-mono-num text-lg font-semibold text-[var(--red)]">
          {formatRupiah(Math.max(groupRemaining, 0))}
        </span>
      </div>
      {isPartial && (
        <div className="text-[11px] text-[var(--green)] mt-1 text-right">Sudah dibayar {formatRupiah(groupPaid)}</div>
      )}
    </div>
  );
}
