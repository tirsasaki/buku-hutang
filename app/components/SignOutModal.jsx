export default function SignOutModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
      <div className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="w-11 h-11 rounded-full bg-[var(--red-soft)] flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-ledger text-lg mb-1">Keluar dari akun?</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-4">Kamu perlu masuk kembali untuk mengakses catatan hutang pelanggan.</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]">
            Batal
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-[var(--red)] text-white text-sm font-medium">
            Ya, keluar
          </button>
        </div>
      </div>
    </div>
  );
}
