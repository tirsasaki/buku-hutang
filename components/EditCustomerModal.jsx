"use client";

import { useState } from "react";

// Modal edit nomor WhatsApp pelanggan. Menyimpan state form (nilai input)
// sendiri, dan tidak tahu apa-apa soal Supabase atau state halaman lain —
// cukup panggil onSave(phone) saat form disubmit, komponen pemanggil yang
// menentukan apa yang terjadi setelahnya (simpan ke database, tutup modal, dst).
export default function EditCustomerModal({ customer, onSave, onClose }) {
  const [phone, setPhone] = useState(customer?.phone || "");

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(phone);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-3">No. WhatsApp pelanggan</h2>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">No. WhatsApp</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 08123456789"
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
            Batal
          </button>
          <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
