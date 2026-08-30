"use client";

import { formatRupiah } from "../lib/debt-utils";

// Bagian atas halaman utama yang selalu tampil terlepas dari tab home mana
// yang aktif: kartu ringkasan "Total belum lunas" (dengan donut persentase),
// dua kartu mini statistik (jumlah pelanggan & sudah lunas), dan pill
// switcher untuk berpindah antara tab Kasir & Pelanggan. Murni presentasional
// — semua angka sudah dihitung oleh page.jsx dan diterima lewat props.
//
// Props:
// - totalUnpaid, totalCustomers, countUnpaid, countLunas, unpaidRatio: angka ringkasan
// - homeTab: "kasir" | "pelanggan"
// - onHomeTabChange(tab): dipanggil saat pill switcher diklik
export default function HomeSummary({
  totalUnpaid,
  totalCustomers,
  countUnpaid,
  countLunas,
  unpaidRatio,
  homeTab,
  onHomeTabChange,
}) {
  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--card)] to-[var(--surface-soft)] border border-[var(--paper-line)] rounded-[22px] shadow-sm mb-3">
        <div
          className="absolute -top-14 -right-14 w-40 h-40 rounded-full opacity-[0.09] pointer-events-none blur-[2px]"
          style={{ background: "var(--red)" }}
        />
        <div
          className="absolute -bottom-16 -left-10 w-32 h-32 rounded-full opacity-[0.05] pointer-events-none blur-[2px]"
          style={{ background: "var(--gold)" }}
        />
        {/* Garis perforasi tipis di tepi atas, ala kupon nota */}
        <div
          className="absolute top-0 left-6 right-6 h-px opacity-40 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, var(--ink-faint) 0 4px, transparent 4px 9px)",
          }}
        />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[var(--ink-soft)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2v20M17 6.5c0-1.93-2.24-3.5-5-3.5S7 4.57 7 6.5 9.24 9 12 9s5 1.07 5 3.5-2.24 3.5-5 3.5-5-1.07-5-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[11px] uppercase tracking-[0.12em] font-semibold">Total belum lunas</span>
              </div>
              <div className="font-mono-num text-[32px] leading-[1.15] font-bold text-[var(--red)] mt-1.5 tabular-nums truncate">
                {formatRupiah(totalUnpaid)}
              </div>
            </div>

            {totalCustomers > 0 && (
              <div className="relative shrink-0 w-[58px] h-[58px]">
                <svg width="58" height="58" viewBox="0 0 58 58" className="-rotate-90">
                  <circle cx="29" cy="29" r="24" fill="none" stroke="var(--paper-line)" strokeWidth="5" />
                  <circle
                    cx="29"
                    cy="29"
                    r="24"
                    fill="none"
                    stroke="var(--red)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - unpaidRatio / 100)}
                    style={{ transition: "stroke-dashoffset 600ms ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono-num text-[13px] font-bold text-[var(--ink)]">{unpaidRatio}%</span>
                </div>
              </div>
            )}
          </div>

          {totalCustomers > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-dashed border-[var(--paper-line)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--red)] shrink-0" />
                <span className="text-xs text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">{countUnpaid}</span> belum lunas
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--green)] shrink-0" />
                <span className="text-xs text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">{countLunas}</span> lunas
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="relative overflow-hidden bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--gold-soft)] flex items-center justify-center mb-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                stroke="var(--gold)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.08em] font-medium">Jumlah pelanggan</div>
          <div className="font-mono-num text-2xl font-bold text-[var(--ink)] mt-0.5 tabular-nums">{totalCustomers}</div>
        </div>

        <div className="relative overflow-hidden bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--green-soft)] flex items-center justify-center mb-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.08em] font-medium">Sudah lunas</div>
          <div className="font-mono-num text-2xl font-bold text-[var(--ink)] mt-0.5 tabular-nums">{countLunas}</div>
        </div>
      </div>

      <div className="relative flex bg-[var(--card)] border border-[var(--paper-line)] rounded-full p-1 mb-5 text-sm font-semibold">
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-[var(--ink)] shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: homeTab === "kasir" ? "translateX(0%)" : "translateX(calc(100% + 8px))" }}
        />
        <div
          onClick={() => onHomeTabChange("kasir")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-center py-2 rounded-full cursor-pointer select-none transition-colors duration-200 ${
            homeTab === "kasir" ? "text-[var(--paper)]" : "text-[var(--ink-soft)]"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9h18M5 9l1.5-5h11L19 9M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M9 13h6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Kasir
        </div>
        <div
          onClick={() => onHomeTabChange("pelanggan")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 text-center py-2 rounded-full cursor-pointer select-none transition-colors duration-200 ${
            homeTab === "pelanggan" ? "text-[var(--paper)]" : "text-[var(--ink-soft)]"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Pelanggan
        </div>
      </div>
    </>
  );
}
