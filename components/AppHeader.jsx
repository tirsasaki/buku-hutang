"use client";

import Link from "next/link";
import ThemeSwitcher from "../app/ThemeSwitcher";

// Header di halaman utama (daftar pelanggan): logo & judul aplikasi, plus
// toolbar ikon untuk ganti tema, buka Backup & Restore, buka Profil, dan
// keluar akun. Murni presentasional — page.jsx yang memutuskan apa yang
// terjadi saat tombol keluar diklik (buka modal konfirmasi).
//
// Props:
// - onSignOutClick(): dipanggil saat tombol "Keluar" diklik
export default function AppHeader({ onSignOutClick }) {
  return (
    <div className="flex items-center justify-between mb-5 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-[var(--ink)] flex items-center justify-center shrink-0 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 4.5h11a1.5 1.5 0 0 1 1.5 1.5v14l-3-1.8-2.5 1.8-2.5-1.8-2.5 1.8-2-1.4V6a1.5 1.5 0 0 1 1.5-1.5Z"
              stroke="var(--gold)"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M8.5 8.5h7M8.5 12h7" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="font-ledger text-2xl leading-none truncate">Buku Hutang</h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1.5 truncate">Catatan hutang pelanggan</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-full p-1 shadow-sm shrink-0">
        <ThemeSwitcher variant="plain" />
        <div className="w-px h-5 bg-[var(--paper-line)]" />
        <Link
          href="/backup"
          title="Backup & Restore"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[var(--ink-soft)] hover:bg-[var(--surface-soft)] active:scale-90 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="w-px h-5 bg-[var(--paper-line)]" />
        <Link
          href="/profile"
          title="Profil"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[var(--ink-soft)] hover:bg-[var(--surface-soft)] active:scale-90 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 20.5c1.5-4 4.5-6 7.5-6s6 2 7.5 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="w-px h-5 bg-[var(--paper-line)]" />
        <button
          onClick={onSignOutClick}
          title="Keluar"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[var(--ink-soft)] hover:bg-[var(--red-soft)] hover:text-[var(--red)] active:scale-90 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
