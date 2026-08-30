"use client";

import { useState } from "react";
import CustomerCard from "./CustomerCard";

const SORT_OPTIONS = [
  { id: "terbaru", label: "Terbaru" },
  { id: "terlama", label: "Terlama" },
  { id: "nominal-desc", label: "Nominal terbesar" },
  { id: "nominal-asc", label: "Nominal terkecil" },
  { id: "nama-az", label: "Nama A–Z" },
  { id: "nama-za", label: "Nama Z–A" },
];

// Isi tab "Pelanggan" di halaman utama: kotak cari, menu urutkan, chip filter
// status (semua/belum lunas/lunas), dan daftar kartu pelanggan. Memegang
// sendiri state pencarian/pengurutan/filter beserta hasil penyaringannya —
// page.jsx cukup memberi data mentah & fungsi kalkulasi, komponen ini yang
// menyaring & mengurutkan untuk ditampilkan.
//
// Props:
// - customers: daftar pelanggan mentah (belum difilter)
// - getBalance(custId): fungsi hitung sisa hutang pelanggan
// - getLastActivity(custId): fungsi ambil tanggal transaksi terakhir
// - getCreditBalance(custId): fungsi hitung saldo lebih pelanggan
// - totalCustomers, countUnpaid, countLunas: angka ringkasan (dihitung di page.jsx,
//     dipakai bersama dengan kartu statistik di atas tab ini) — dipakai untuk badge chip filter
// - onSelectCustomer(custId): dipanggil saat sebuah kartu pelanggan diklik
export default function CustomerTab({
  customers,
  getBalance,
  getLastActivity,
  getCreditBalance,
  totalCustomers,
  countUnpaid,
  countLunas,
  onSelectCustomer,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("terbaru");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filteredCustomers = customers
    .filter((c) => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((c) => ({ ...c, balance: getBalance(c.id), last: getLastActivity(c.id) }))
    .filter((c) => {
      if (statusFilter === "belum") return c.balance > 0;
      if (statusFilter === "lunas") return c.balance <= 0;
      return true;
    })
    .sort((a, b) => {
      if (!a.last && !b.last) return a.name.localeCompare(b.name);
      if (!a.last) return 1;
      if (!b.last) return -1;
      switch (sortBy) {
        case "terlama":
          return new Date(a.last) - new Date(b.last);
        case "nominal-desc":
          return b.balance - a.balance;
        case "nominal-asc":
          return a.balance - b.balance;
        case "nama-az":
          return a.name.localeCompare(b.name);
        case "nama-za":
          return b.name.localeCompare(a.name);
        case "terbaru":
        default:
          return new Date(b.last) - new Date(a.last);
      }
    });

  return (
    <>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] pointer-events-none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-[var(--paper-line)] bg-[var(--card)] text-sm shadow-sm outline-none focus:border-[var(--gold)] focus:ring-4 focus:ring-[var(--gold)]/10 transition-all duration-200"
          />
          {searchTerm && (
            <div
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--paper-line)] flex items-center justify-center cursor-pointer"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="var(--ink-soft)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowSortMenu((v) => !v)}
            title="Urutkan"
            className={`w-[42px] h-[42px] rounded-2xl border shadow-sm flex items-center justify-center transition-all duration-200 ${
              showSortMenu ? "border-[var(--gold)] bg-[var(--gold-soft)] text-[var(--gold)]" : "border-[var(--paper-line)] bg-[var(--card)] text-[var(--ink-soft)] hover:border-[var(--gold)]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-lg z-20 p-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)] px-2.5 pt-1.5 pb-1">Urutkan</div>
                {SORT_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id);
                      setShowSortMenu(false);
                    }}
                    className={`px-2.5 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between select-none ${
                      sortBy === opt.id ? "bg-[var(--paper)] text-[var(--gold)] font-semibold" : "text-[var(--ink-soft)] hover:bg-[var(--paper)]"
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.id && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { id: "semua", label: "Semua", count: totalCustomers },
          { id: "belum", label: "Belum lunas", count: countUnpaid },
          { id: "lunas", label: "Lunas", count: countLunas },
        ].map((f) => (
          <div
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all duration-200 ${
              statusFilter === f.id
                ? "bg-[var(--ink)] text-[var(--paper)] shadow-sm"
                : "bg-[var(--card)] border border-[var(--paper-line)] text-[var(--ink-soft)] hover:border-[var(--gold)]"
            }`}
          >
            {f.label}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                statusFilter === f.id ? "bg-white/20" : "bg-[var(--paper)] text-[var(--ink-faint)]"
              }`}
            >
              {f.count}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {filteredCustomers.length === 0 && (
          <div className="text-center py-16 text-sm text-[var(--ink-soft)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--card)] border border-[var(--paper-line)] flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
                <path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {searchTerm || statusFilter !== "semua" ? "Tidak ada pelanggan yang cocok." : "Belum ada pelanggan tercatat."}
          </div>
        )}
        {filteredCustomers.map((c) => (
          <CustomerCard key={c.id} customer={c} credit={getCreditBalance(c.id)} onClick={() => onSelectCustomer(c.id)} />
        ))}
      </div>
    </>
  );
}
