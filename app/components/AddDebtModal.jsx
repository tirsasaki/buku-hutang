export default function AddDebtModal({
  itemName,
  qty,
  unitPrice,
  amount,
  date,
  kasir,
  amountError,
  onItemNameChange,
  onQtyChange,
  onUnitPriceChange,
  onAmountChange,
  onDateChange,
  onKasirChange,
  onCancel,
  onSubmit,
}) {
  const multiple = (parseInt(qty) || 1) > 1;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <form onSubmit={onSubmit} className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
        <h2 className="font-ledger text-lg mb-3">Tambah hutang baru</h2>
        <div className="mb-3"><label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Barang</label><input value={itemName} onChange={(event) => onItemNameChange(event.target.value)} placeholder="Contoh: Beras 5kg" className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" /></div>
        <div className="mb-3"><label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Qty (pcs)</label><input type="number" min="1" value={qty} onChange={(event) => onQtyChange(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" /></div>
        <div className="mb-3"><label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Harga per item (Rp)</label><input type="number" min="0" value={unitPrice} disabled={!multiple} onChange={(event) => onUnitPriceChange(event.target.value)} placeholder={!multiple ? "Otomatis (qty 1)" : ""} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${!multiple ? "border-[var(--paper-line)] bg-[var(--paper-line)]/40 text-[var(--ink-soft)] cursor-not-allowed" : "border-[var(--paper-line)] bg-[var(--paper)] focus:border-[var(--gold)]"}`} /></div>
        <div className="mb-3"><label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Total harga (Rp)</label><input type="number" min="0" value={amount} disabled={multiple} onChange={(event) => onAmountChange(event.target.value)} placeholder={multiple ? "Otomatis (qty x harga per item)" : ""} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${multiple ? "border-[var(--paper-line)] bg-[var(--paper-line)]/40 text-[var(--ink-soft)] cursor-not-allowed" : "border-[var(--paper-line)] bg-[var(--paper)] focus:border-[var(--gold)]"}`} />{amountError && <div className="text-xs text-[var(--red)] mt-1">Masukkan jumlah yang benar</div>}</div>
        <div className="mb-4"><label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Tanggal</label><input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" /></div>
        <div className="mb-4"><label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Kasir (opsional)</label><div className="flex gap-2 flex-wrap mb-2">{["Saya", "Fuji", "Ibu"].map((name) => <button type="button" key={name} onClick={() => onKasirChange(name)} className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer ${kasir === name ? "bg-[var(--gold)] border-[var(--gold)] text-white" : "border-[var(--paper-line)]"}`}>{name}</button>)}</div><input value={kasir} onChange={(event) => onKasirChange(event.target.value)} placeholder="Atau ketik nama kasir" className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" /></div>
        <div className="flex gap-2"><button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">Batal</button><button type="submit" className="flex-1 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium">Simpan</button></div>
      </form>
    </div>
  );
}
