export default function AddCustomerModal({ name, phone, nameError, onNameChange, onPhoneChange, onCancel, onSubmit }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={onSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-3">Pelanggan baru</h2>
        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Nama pelanggan</label>
          <input value={name} onChange={(event) => onNameChange(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" />
          {nameError && <div className="text-xs text-[var(--red)] mt-1">Nama wajib diisi</div>}
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">No. WhatsApp (opsional)</label>
          <input value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="Contoh: 08123456789" className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">Batal</button>
          <button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">Simpan</button>
        </div>
      </form>
    </div>
  );
}
