"use client";

import { useState } from "react";
import {
  formatRupiah,
  formatThousands,
  stripThousands,
  customerColor,
  customerInitials,
} from "../lib/debt-utils";

// Catatan: walau namanya "*Modal" (mengikuti penamaan di rencana refactor),
// komponen ini sebenarnya isi tab "Kasir" — dirender langsung di halaman,
// bukan sebagai overlay. Sub-bagian "pilih pelanggan" di dalamnya (dipicu
// tombol "Pelanggan") itulah yang berupa overlay modal sungguhan.
//
// Memegang semua state form transaksi banyak barang sekaligus (pelanggan,
// tanggal, kasir, daftar barang dengan sinkronisasi qty <-> harga per item
// <-> total harga), termasuk state pencarian di popup pemilih pelanggan.
//
// Modal ini tidak menyentuh Supabase / nomor invoice. Saat submit valid,
// ia memanggil onConfirm(payload) dan mereset form sendiri setelah selesai.
// Pemanggil (page.jsx) yang mengurus getNextInvoiceNo, insert bulk ke
// debt_items, dan fetchAll().
//
// Props:
// - customers: daftar pelanggan (untuk popup pemilih)
// - getCustomerBalance(custId): fungsi hitung sisa hutang pelanggan, untuk badge lunas/belum di popup
// - kasirNames: daftar nama kasir untuk pilihan cepat
// - onConfirm(payload): dipanggil saat submit valid,
//     payload = { customerId, customerName, date, kasir, items: [{ item, qty, amount }] }
// - onOpenAddCustomer(): dipanggil saat user memilih "Pelanggan baru" dari popup,
//     supaya page.jsx yang membuka modal Tambah Pelanggan
function emptyRow() {
  return { item: "", qty: 1, amount: "", unitPrice: "" };
}

// - initialCustomerId: id pelanggan yang otomatis dipilih saat form pertama kali
//     dirender (dipakai saat pengguna diarahkan ke sini dari tombol "Tambah
//     hutang baru" di halaman detail pelanggan). Pemanggil bertanggung jawab
//     memberi `key` yang berubah tiap kali ingin form "dimulai ulang" dengan
//     prefill baru (lihat komentar di page.jsx).
export default function BulkDebtModal({ customers, getCustomerBalance, kasirNames, onConfirm, onOpenAddCustomer, initialCustomerId }) {
  const [customerId, setCustomerId] = useState(initialCustomerId || "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [kasir, setKasir] = useState("");
  const [items, setItems] = useState([emptyRow()]);
  const [customerError, setCustomerError] = useState(false);
  const [itemErrors, setItemErrors] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const pickerResults = customers
    .filter((c) => !pickerSearch || c.name.toLowerCase().includes(pickerSearch.toLowerCase()))
    .map((c) => ({ ...c, balance: getCustomerBalance(c.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  function resetForm() {
    setCustomerId("");
    setDate(new Date().toISOString().split("T")[0]);
    setKasir("");
    setItems([emptyRow()]);
    setCustomerError(false);
    setItemErrors({});
  }

  function hasData() {
    return !!customerId || !!kasir.trim() || items.some((r) => r.item.trim() || r.amount !== "" || Number(r.qty) !== 1);
  }

  function handleClear() {
    if (hasData() && !confirm("Bersihkan seluruh isian transaksi ini?")) return;
    resetForm();
  }

  function addRow() {
    setItems((rows) => [...rows, emptyRow()]);
  }

  function removeRow(idx) {
    setItems((rows) => rows.filter((_, i) => i !== idx));
  }

  // Sinkronisasi antar qty, harga per item, & total harga:
  // - qty = 1  -> "harga per item" nonaktif, mengikuti "total harga" (1:1)
  // - qty >= 2 -> "harga per item" aktif, "total harga" dihitung otomatis (qty x harga per item)
  function updateRow(idx, field, value) {
    setItems((rows) =>
      rows.map((r, i) => {
        if (i !== idx) return r;
        const row = { ...r, [field]: value };

        if (field === "qty") {
          const q = parseInt(value) || 1;
          if (q <= 1) {
            row.unitPrice = row.amount;
          } else {
            const unit = parseFloat(row.unitPrice) || 0;
            row.amount = unit ? String(unit * q) : row.amount;
          }
        } else if (field === "unitPrice") {
          const q = parseInt(row.qty) || 1;
          const unit = parseFloat(value) || 0;
          row.amount = value === "" ? "" : String(unit * q);
        } else if (field === "amount") {
          const q = parseInt(row.qty) || 1;
          if (q <= 1) {
            row.unitPrice = value;
          }
        }

        return row;
      })
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let hasError = false;

    if (!customerId) {
      setCustomerError(true);
      hasError = true;
    } else {
      setCustomerError(false);
    }

    const errors = {};
    items.forEach((row, idx) => {
      const amt = parseFloat(row.amount);
      if (!amt || amt <= 0 || isNaN(amt)) {
        errors[idx] = true;
        hasError = true;
      }
    });
    setItemErrors(errors);
    if (hasError) return;

    await onConfirm({
      customerId,
      customerName: selectedCustomer?.name || "",
      date: date || new Date().toISOString().split("T")[0],
      kasir: kasir.trim() || null,
      items: items.map((row) => ({
        item: row.item.trim(),
        qty: parseInt(row.qty) || 1,
        amount: parseFloat(row.amount),
      })),
    });
    resetForm();
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-ledger text-lg">Transaksi piutang baru</h2>
        <p className="text-xs text-[var(--ink-soft)] mt-0.5">Catat barang yang diambil pelanggan secara utang</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-4 mb-3 space-y-3">
          <div>
            <label className="block text-xs text-[var(--ink-soft)] mb-1.5 font-medium">Pelanggan</label>
            <button
              type="button"
              onClick={() => {
                setPickerSearch("");
                setShowPicker(true);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-[var(--paper)] text-sm text-left transition-colors ${
                customerError ? "border-[var(--red)]" : "border-[var(--paper-line)] hover:border-[var(--gold)]"
              }`}
            >
              {selectedCustomer ? (
                <>
                  <div
                    style={{ backgroundColor: customerColor(selectedCustomer.name) }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  >
                    {customerInitials(selectedCustomer.name)}
                  </div>
                  <span className="flex-1 min-w-0 truncate font-medium text-[var(--ink)]">{selectedCustomer.name}</span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-[var(--paper-line)] flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        stroke="var(--ink-soft)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="flex-1 text-[var(--ink-faint)]">Pilih pelanggan...</span>
                </>
              )}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--ink-soft)]">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {customerError && <div className="text-xs text-[var(--red)] mt-1">Pilih pelanggan dulu</div>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[var(--ink-soft)] mb-1.5 font-medium">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--ink-soft)] mb-1.5 font-medium">Kasir (opsional)</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {kasirNames.map((name) => (
                <div
                  key={name}
                  onClick={() => setKasir(name)}
                  className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${
                    kasir === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)] text-[var(--ink-soft)]"
                  }`}
                >
                  {name}
                </div>
              ))}
            </div>
            <input
              value={kasir}
              onChange={(e) => setKasir(e.target.value)}
              placeholder="Atau ketik nama kasir"
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide">Daftar barang</span>
          <span className="text-xs text-[var(--ink-soft)]">{items.length} item</span>
        </div>

        <div className="space-y-2.5">
          {items.map((row, idx) => (
            <div key={idx} className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--gold)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[var(--ink-soft)]">Barang</span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    title="Hapus barang ini"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--red-soft)] hover:text-[var(--red)] active:scale-90 transition-all duration-200 shrink-0"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m2 0-.8 13.6a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                value={row.item}
                onChange={(e) => updateRow(idx, "item", e.target.value)}
                placeholder="Contoh: Beras 5kg"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm mb-2 outline-none focus:border-[var(--gold)] transition-colors"
              />
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="block text-[11px] text-[var(--ink-soft)] mb-1 font-medium">Qty (pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={row.qty}
                    onChange={(e) => updateRow(idx, "qty", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-[11px] text-[var(--ink-soft)] mb-1 font-medium">Harga per item (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatThousands(row.unitPrice)}
                    disabled={(parseInt(row.qty) || 1) <= 1}
                    onChange={(e) => updateRow(idx, "unitPrice", stripThousands(e.target.value))}
                    placeholder={(parseInt(row.qty) || 1) <= 1 ? "Otomatis (qty 1)" : ""}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors ${
                      (parseInt(row.qty) || 1) <= 1
                        ? "border-[var(--paper-line)] bg-[var(--paper-line)]/40 text-[var(--ink-soft)] cursor-not-allowed"
                        : "border-[var(--paper-line)] bg-[var(--paper)] focus:border-[var(--gold)]"
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--ink-soft)] mb-1 font-medium">Total harga (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(row.amount)}
                  disabled={(parseInt(row.qty) || 1) > 1}
                  onChange={(e) => updateRow(idx, "amount", stripThousands(e.target.value))}
                  placeholder={(parseInt(row.qty) || 1) > 1 ? "Otomatis (qty x harga per item)" : ""}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-colors ${
                    (parseInt(row.qty) || 1) > 1
                      ? "border-[var(--paper-line)] bg-[var(--paper-line)]/40 text-[var(--ink-soft)] cursor-not-allowed"
                      : "border-[var(--paper-line)] bg-[var(--paper)] focus:border-[var(--gold)]"
                  }`}
                />
              </div>
              {itemErrors[idx] && <div className="text-xs text-[var(--red)] mt-1.5">Masukkan jumlah yang benar</div>}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-[var(--paper-line)] text-sm text-[var(--gold)] font-semibold cursor-pointer select-none flex items-center justify-center gap-1.5 hover:bg-[var(--card)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Tambah barang lain
        </button>

        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl shadow-sm p-4 mt-4 mb-3 flex items-center justify-between">
          <span className="text-sm text-[var(--ink-soft)] font-medium">Total transaksi</span>
          <span className="font-mono-num text-lg font-semibold text-[var(--red)]">
            {formatRupiah(items.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0))}
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleClear}
            title="Bersihkan isian"
            className="shrink-0 w-12 flex items-center justify-center rounded-xl border border-[var(--paper-line)] text-[var(--ink-soft)] hover:border-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red-soft)] active:scale-95 transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m2 0-.8 13.6a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--green)] text-white text-sm font-semibold shadow-sm active:scale-[0.99] transition-transform">
            Simpan transaksi
          </button>
        </div>
      </form>

      {showPicker && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-sm max-h-[78vh] flex flex-col shadow-xl animate-rise"
          >
            <div className="p-4 pb-3 border-b border-[var(--paper-line)] shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-ledger text-base">Pilih pelanggan</h3>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] pointer-events-none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Cari nama pelanggan..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {pickerResults.length === 0 && (
                <div className="text-center py-12 text-sm text-[var(--ink-soft)]">
                  Tidak ada pelanggan yang cocok.
                </div>
              )}
              {pickerResults.map((c) => {
                const isSelected = c.id === customerId;
                const isLunas = c.balance <= 0;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerError(false);
                      setShowPicker(false);
                    }}
                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer select-none transition-colors ${
                      isSelected ? "bg-[var(--gold-soft)]" : "hover:bg-[var(--paper)]"
                    }`}
                  >
                    <div
                      style={{ backgroundColor: customerColor(c.name) }}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    >
                      {customerInitials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate text-[var(--ink)]">{c.name}</div>
                      <div className={`text-xs mt-0.5 truncate ${isLunas ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                        {isLunas ? "Lunas" : `Belum lunas ${formatRupiah(c.balance)}`}
                      </div>
                    </div>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--gold)]">
                        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-[var(--paper-line)] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  onOpenAddCustomer();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[var(--paper-line)] text-sm text-[var(--gold)] font-semibold hover:bg-[var(--paper)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Pelanggan baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
