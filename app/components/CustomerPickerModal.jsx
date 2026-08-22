import { customerColor, customerInitials, formatRupiah } from "../../lib/ledgerUtils";

export default function CustomerPickerModal({
  customers,
  search,
  selectedCustomerId,
  onSearchChange,
  onSelect,
  onClose,
  onNewCustomer,
}) {
  const results = customers
    .filter((customer) => !search || customer.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="bg-[var(--card)] rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-sm max-h-[78vh] flex flex-col shadow-xl animate-rise">
        <div className="p-4 pb-3 border-b border-[var(--paper-line)] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-ledger text-base">Pilih pelanggan</h3>
            <button type="button" onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors" aria-label="Tutup">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="relative">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] pointer-events-none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="M21 21l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <input autoFocus type="text" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cari nama pelanggan..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors" />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {results.length === 0 && <div className="text-center py-12 text-sm text-[var(--ink-soft)]">Tidak ada pelanggan yang cocok.</div>}
          {results.map((customer) => {
            const isSelected = customer.id === selectedCustomerId;
            const isLunas = customer.balance <= 0;
            return (
              <div key={customer.id} onClick={() => onSelect(customer.id)} className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer select-none transition-colors ${isSelected ? "bg-[var(--gold-soft)]" : "hover:bg-[var(--paper)]"}`}>
                <div style={{ backgroundColor: customerColor(customer.name) }} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{customerInitials(customer.name)}</div>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate text-[var(--ink)]">{customer.name}</div><div className={`text-xs mt-0.5 truncate ${isLunas ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{isLunas ? "Lunas" : `Belum lunas ${formatRupiah(customer.balance)}`}</div></div>
                {isSelected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--gold)]"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-[var(--paper-line)] shrink-0">
          <button type="button" onClick={onNewCustomer} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[var(--paper-line)] text-sm text-[var(--gold)] font-semibold hover:bg-[var(--paper)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            Pelanggan baru
          </button>
        </div>
      </div>
    </div>
  );
}
