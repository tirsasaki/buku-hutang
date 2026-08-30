"use client";

// Baris tombol "Bagikan Tagihan / Salin teks / WhatsApp" plus tombol
// pelunasan ("Tandai semua lunas" & "Pakai saldo lebih") di halaman detail
// pelanggan. Murni presentasional — semua aksi (share, tandai lunas, pakai
// saldo) dan kondisi tampil tombol saldo (hasCredit && hasDebt) ditentukan
// oleh pemanggil.
//
// Props:
// - onShare(), onCopyText(), onShareWa(): aksi bagikan tagihan
// - onMarkAllPaid(): dipanggil saat "Tandai semua lunas" diklik
// - onUseCredit(): dipanggil saat "Pakai saldo lebih" diklik
// - showUseCreditButton: apakah tombol "Pakai saldo lebih" ditampilkan
//     (pelanggan punya saldo lebih DAN masih punya hutang aktif)
export default function CustomerActions({ onShare, onCopyText, onShareWa, onMarkAllPaid, onUseCredit, showUseCreditButton }) {
  return (
    <>
      <div className="flex gap-2.5 mb-4">
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[var(--card)] border border-[var(--paper-line)] text-sm font-medium text-[var(--ink)] shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="6" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="18" cy="19" r="2.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8.3 10.7 15.7 6.3M8.3 13.3l7.4 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Bagikan Tagihan
        </button>
        <button
          onClick={onCopyText}
          title="Salin teks"
          aria-label="Salin teks tagihan"
          className="flex-none w-12 flex items-center justify-center rounded-2xl bg-[var(--card)] border border-[var(--paper-line)] text-[var(--ink)] shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="8.5" y="8.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
        <button
          onClick={onShareWa}
          title="Langsung ke WhatsApp"
          aria-label="Langsung ke WhatsApp"
          className="flex-none w-12 flex items-center justify-center rounded-2xl bg-[var(--green-soft)] border border-transparent text-[var(--green)] shadow-sm hover:brightness-[0.97] active:scale-[0.98] transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M17.6 6.3A8.4 8.4 0 0 0 3.9 15.9L3 21l5.2-1.4A8.4 8.4 0 1 0 17.6 6.3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M8.5 9.7c.3 2.6 2.5 4.7 5.1 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-[0.12em] font-medium mb-2 px-0.5">
          Pelunasan
        </div>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onMarkAllPaid}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[var(--green-soft)] border border-transparent text-[var(--green)] text-sm font-semibold shadow-sm hover:brightness-[0.97] active:scale-[0.98] transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tandai semua lunas
          </button>

          {showUseCreditButton && (
            <button
              onClick={onUseCredit}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[var(--card)] border border-[var(--gold)]/40 text-[var(--gold)] text-sm font-medium shadow-sm hover:bg-[var(--gold-soft)] active:scale-[0.98] transition-all duration-200"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 7.5v9M9.5 9.7c0-1.2 1.1-2.2 2.5-2.2s2.5.8 2.5 1.9-1 1.6-2.5 1.9-2.5.8-2.5 1.9 1.1 1.9 2.5 1.9 2.5-.9 2.5-2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Pakai saldo lebih untuk bayar hutang
            </button>
          )}
        </div>
      </div>
    </>
  );
}
