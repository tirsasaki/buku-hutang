"use client";

import { formatRupiah, customerColor, customerInitials } from "../lib/debt-utils";

// Bagian atas halaman detail pelanggan: tombol "Daftar pelanggan" (kembali),
// kartu profil dengan avatar & nama, tombol tambah/ubah nomor WA, total sisa
// hutang, dan badge saldo lebih (kalau ada). Murni presentasional — semua
// angka (balance, credit) sudah dihitung page.jsx dan diterima lewat props.
//
// Props:
// - customer: { id, name, phone }
// - balance: sisa hutang pelanggan (angka)
// - credit: saldo lebih pelanggan (angka)
// - onBack(): dipanggil saat tombol "Daftar pelanggan" diklik
// - onEditPhone(): dipanggil saat tombol nomor WA diklik
export default function CustomerDetailHeader({ customer, balance, credit, onBack, onEditPhone }) {
  const isLunas = balance <= 0;

  return (
    <>
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-lg text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--card)] active:scale-95 transition-all duration-200 select-none mb-3"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Daftar pelanggan
      </button>

      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--card)] to-[var(--surface-soft)] border border-[var(--paper-line)] rounded-[26px] shadow-sm p-6 text-center mb-4">
        <div
          className="absolute -top-16 -right-14 w-40 h-40 rounded-full opacity-[0.08] pointer-events-none blur-[2px]"
          style={{ background: "var(--gold)" }}
        />
        <div
          className="absolute -bottom-16 -left-12 w-36 h-36 rounded-full opacity-[0.06] pointer-events-none blur-[2px]"
          style={{ background: isLunas ? "var(--green)" : "var(--red)" }}
        />

        <div className="relative">
          <div
            style={{ backgroundColor: customerColor(customer.name) }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-md ring-4 ring-[var(--card)]"
          >
            {customerInitials(customer.name)}
          </div>
          <div className="font-ledger text-2xl mb-1.5">{customer.name}</div>

          {customer.phone && customer.phone.trim() ? (
            <button
              onClick={onEditPhone}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] bg-[var(--paper)]/60 hover:bg-[var(--paper)] border border-[var(--paper-line)] rounded-full px-3 py-1.5 transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h3.1a1 1 0 0 1 .98.79l.7 3.15a1 1 0 0 1-.27.94L7.6 10.4a11 11 0 0 0 6 6l1.52-1.4a1 1 0 0 1 .95-.27l3.14.7a1 1 0 0 1 .79.98v3.1a1.5 1.5 0 0 1-1.5 1.5H18C9.72 21 3 14.28 3 6V5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              {customer.phone}
              <span className="text-[var(--ink-faint)]">&middot; ubah</span>
            </button>
          ) : (
            <button
              onClick={onEditPhone}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gold)] bg-[var(--gold-soft)] hover:brightness-95 rounded-full px-3 py-1.5 transition-all duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Tambah nomor WA
            </button>
          )}

          <div className="mt-5 pt-4 border-t border-dashed border-[var(--paper-line)]">
            <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.12em] font-medium">Total sisa hutang</div>
            <div
              className={`font-mono-num text-[34px] leading-tight font-bold mt-1 tabular-nums ${
                isLunas ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {formatRupiah(balance)}
            </div>
          </div>

          {credit > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saldo lebih: {formatRupiah(credit)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
