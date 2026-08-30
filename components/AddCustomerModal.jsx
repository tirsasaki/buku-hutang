"use client";

import { useState } from "react";

// Modal "Pelanggan baru": form nama & nomor WA. Memegang state form sendiri,
// tidak menyentuh Supabase — saat submit valid memanggil onConfirm(payload)
// dan membiarkan pemanggil (page.jsx) yang menyimpan & fetchAll().
//
// Props:
// - onConfirm(payload): dipanggil saat submit valid, payload = { name, phone }
// - onClose(): dipanggil saat modal dibatalkan
export default function AddCustomerModal({ onConfirm, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    await onConfirm({ name, phone });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={handleSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-3">Pelanggan baru</h2>
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Nama pelanggan</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
          {nameError && <div className="text-xs text-[var(--red)] mt-1">Nama wajib diisi</div>}
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">No. WhatsApp (opsional)</label>
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
