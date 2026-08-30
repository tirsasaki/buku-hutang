"use client";

// Modal konfirmasi generik untuk aksi yang butuh persetujuan eksplisit dari
// user (hapus data, dsb). Presentasional murni, mirip SignOutConfirmModal,
// tapi title/message/label tombol bisa disesuaikan per pemanggil -- supaya
// tidak perlu bikin modal baru tiap ada aksi konfirmasi baru di masa depan.
//
// Props:
// - title: judul singkat modal
// - message: penjelasan konsekuensi aksi
// - confirmLabel: teks tombol konfirmasi (default "Ya, lanjutkan")
// - onConfirm(): dipanggil saat tombol konfirmasi diklik
// - onClose(): dipanggil saat "Batal" diklik
export default function ConfirmModal({ title, message, confirmLabel = "Ya, lanjutkan", onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-[60]">
      <div className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="w-11 h-11 rounded-full bg-[var(--red-soft)] flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1A2 2 0 0 1 16.2 21H7.8a2 2 0 0 1-2-1.9L5 7" stroke="var(--red)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-ledger text-lg mb-1">{title}</h2>
        <p className="text-xs text-[var(--ink-soft)] mb-4">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-[var(--red)] text-white text-sm font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
