// Tombol bulat mengambang di pojok kanan bawah, dipakai untuk aksi utama
// tiap halaman (tambah pelanggan di beranda, tambah hutang di detail
// pelanggan). Prop "rotated" opsional untuk kasus tombol yang berfungsi
// sebagai toggle (ikon "+" berputar jadi "x" saat form/panel sedang terbuka).
export default function FabButton({ onClick, title, rotated = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-lg flex items-center justify-center z-30 active:scale-90 transition-transform duration-200"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className={`transition-transform duration-300 ease-out ${rotated ? "rotate-45" : "rotate-0"}`}
      >
        <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
