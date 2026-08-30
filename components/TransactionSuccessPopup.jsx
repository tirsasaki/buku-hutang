"use client";

import { useEffect, useState } from "react";
import { formatRupiah, customerColor, customerInitials } from "../lib/debt-utils";

// Popup sukses di tengah layar, muncul sesaat setelah transaksi hutang baru
// disimpan dari tab Kasir. Gaya visual dibuat senada dengan tema
// nota/struk aplikasi ini (font-mono-num, garis putus-putus, tepi kertas
// sobek) tapi dengan sedikit teatrikal: badge centang "dicap" ala stempel
// kasir (memakai animasi @keyframes stampDown yang sudah ada di
// globals.css), lalu progress bar tipis yang mengecil sebagai hitung
// mundur auto-tutup.
//
// Murni presentasional & tidak menyimpan apa pun sendiri — semua data
// (nama pelanggan, total, jumlah barang, kasir) sudah dihitung oleh
// pemanggil (useCustomerCrud) dan diteruskan lewat prop `info`.
//
// Props:
// - info: { customerName, customerId, total, itemCount, kasir } | null — kalau null, komponen ini return null
// - onClose(): dipanggil saat popup ditutup (manual atau auto-dismiss)
// - onViewCustomer(customerId): dipanggil saat tombol "Lihat pelanggan" diklik
// - autoCloseMs: durasi auto-tutup dalam ms (default 4000). Set 0 untuk menonaktifkan auto-tutup.
export default function TransactionSuccessPopup({ info, onClose, onViewCustomer, autoCloseMs = 4000 }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!info) return;
    setClosing(false);
    if (!autoCloseMs) return;
    const timer = setTimeout(() => handleClose(), autoCloseMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, autoCloseMs]);

  if (!info) return null;

  // Beri jeda singkat sebelum benar-benar unmount supaya animasi keluar
  // (fade + scale down) sempat terlihat, bukan tiba-tiba hilang.
  function handleClose() {
    setClosing(true);
    setTimeout(() => onClose?.(), 180);
  }

  function handleViewCustomer() {
    setClosing(true);
    setTimeout(() => onViewCustomer?.(info.customerId), 180);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/45 transition-opacity duration-150 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xs paper-torn-top ${closing ? "" : "animate-rise"}`}
        style={closing ? { opacity: 0, transform: "scale(0.96)", transition: "opacity 180ms ease, transform 180ms ease" } : undefined}
      >
        {/* Badge stempel "berhasil", sedikit menjorok keluar dari kartu supaya terasa dicap di atas nota */}
        <div className="relative z-10 flex justify-center -mb-7">
          <div
            className="w-16 h-16 rounded-full bg-[var(--green)] shadow-lg flex items-center justify-center ring-4 ring-[var(--card)] animate-stamp"
            style={{ transformOrigin: "center" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="var(--on-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl shadow-xl pt-11 pb-4 px-5 font-mono-num overflow-hidden">
          <div className="text-center mb-4">
            <div className="text-[10px] tracking-[0.25em] text-[var(--ink-soft)] uppercase">Hutang Tercatat</div>
            <h2 className="font-ledger text-base mt-1">Transaksi Berhasil!</h2>
          </div>

          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div
              style={{ backgroundColor: customerColor(info.customerName) }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            >
              {customerInitials(info.customerName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-[var(--ink)]">{info.customerName}</div>
              <div className="text-[11px] text-[var(--ink-soft)]">
                {info.itemCount} barang{info.kasir ? ` \u00b7 Kasir ${info.kasir}` : ""}
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-[var(--paper-line)] pt-3 flex items-baseline justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Total hutang</span>
            <span className="text-lg font-bold text-[var(--red)] whitespace-nowrap">{formatRupiah(info.total)}</span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--paper-line)] text-sm text-[var(--ink-soft)] font-medium active:scale-[0.98] transition-transform"
            >
              Tutup
            </button>
            <button
              onClick={handleViewCustomer}
              className="flex-1 py-2.5 rounded-xl bg-[var(--green)] text-[var(--on-green)] text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
            >
              Lihat pelanggan
            </button>
          </div>
        </div>

        {/* Progress bar tipis sebagai indikator hitung mundur auto-tutup */}
        {autoCloseMs > 0 && !closing && (
          <div className="h-1 rounded-b-2xl bg-[var(--paper-line)] overflow-hidden -mt-1 mx-0.5">
            <div
              key={info.customerId + String(info.total) + String(info.itemCount)}
              className="h-full bg-[var(--green)]"
              style={{ animation: `shrinkWidth ${autoCloseMs}ms linear forwards` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
