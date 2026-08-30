"use client";

import { formatRupiah, customerColor, customerInitials } from "../lib/debt-utils";

// Kartu satu pelanggan di daftar (tab "Pelanggan"). Murni presentasional —
// semua data (balance, tanggal aktivitas terakhir, saldo lebih) sudah
// dihitung oleh pemanggil dan diterima lewat props. Klik kartu memanggil
// onClick(), pemanggil yang memutuskan apa yang terjadi (buka halaman detail).
//
// Props:
// - customer: { id, name, balance, last } — `balance` & `last` sudah dihitung di CustomerTab
// - credit: saldo lebih pelanggan (angka)
// - onClick(): dipanggil saat kartu diklik
export default function CustomerCard({ customer, credit, onClick }) {
  const isLunas = customer.balance <= 0;
  const lastStr = customer.last
    ? new Date(customer.last).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : null;
  const ccolor = customerColor(customer.name);

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-[var(--card)] border border-[var(--paper-line)] rounded-[20px] shadow-sm pl-4 pr-3.5 py-3.5 cursor-pointer hover:border-[var(--gold)]/50 hover:shadow-md transition-all duration-200 ${
        isLunas ? "opacity-[0.82]" : ""
      }`}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: isLunas ? "var(--green)" : "var(--red)" }}
      />
      <div className="flex items-center gap-3">
        <div
          style={{ backgroundColor: ccolor, boxShadow: `0 0 0 3px ${ccolor}22` }}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
        >
          {customerInitials(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-semibold text-sm truncate text-[var(--ink)]">{customer.name}</div>
            <div className={`font-mono-num text-sm font-semibold tabular-nums shrink-0 ${isLunas ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
              {formatRupiah(customer.balance)}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-1 text-[11px] text-[var(--ink-soft)] min-w-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="truncate">{lastStr || "Belum ada transaksi"}</span>
            </div>
            {isLunas ? (
              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)]">
                Lunas
              </span>
            ) : (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--red-soft)] text-[var(--red)]">
                Belum lunas
              </span>
            )}
          </div>
          {credit > 0 && (
            <div className="inline-flex items-center gap-1 text-[11px] text-[var(--gold)] mt-1 bg-[var(--gold-soft)] px-1.5 py-0.5 rounded-md truncate max-w-full">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="truncate">Saldo lebih {formatRupiah(credit)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
