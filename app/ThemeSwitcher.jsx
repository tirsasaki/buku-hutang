"use client";

import { useEffect, useState } from "react";

export const THEMES = [
  { id: "klasik", label: "Kertas Klasik", colors: ["#F6F0E1", "#2E271E", "#B07E2C"] },
  { id: "malam", label: "Malam Biru", colors: ["#101521", "#E4E9F2", "#E4B872"] },
  { id: "zamrud", label: "Hijau Zamrud", colors: ["#0E1712", "#E3EDE6", "#D9B26A"] },
  { id: "lavender", label: "Krem Lavender", colors: ["#F5F1F8", "#362F45", "#A47DC4"] },
  { id: "kopi", label: "Kopi Senja", colors: ["#16100C", "#EFE3D6", "#D9A24B"] },
];

// Tombol ganti tema (dipakai bersama di halaman utama, login, & daftar) +
// modal pemilihan tema. Ikonnya berupa lingkaran mini yang menampilkan
// cuplikan 3 warna dari tema yang sedang aktif, jadi terlihat lebih hidup
// dan langsung menunjukkan tema apa yang sedang dipakai.
export default function ThemeSwitcher({ className = "", variant = "default" }) {
  const [theme, setTheme] = useState("klasik");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("buku-hutang-theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  function applyTheme(id) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    localStorage.setItem("buku-hutang-theme", id);
  }

  const active = THEMES.find((t) => t.id === theme) || THEMES[0];
  const triggerClass =
    variant === "plain"
      ? "w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-[var(--paper)] active:scale-90 transition-all duration-200"
      : "w-9 h-9 rounded-full border border-[var(--paper-line)] bg-[var(--card)] shadow-sm flex items-center justify-center shrink-0 hover:border-[var(--gold)] hover:shadow-md active:scale-90 transition-all duration-200";

  return (
    <>
      <button onClick={() => setOpen(true)} title="Ganti tema" className={`${triggerClass} ${className}`}>
        <span
          className="block w-[18px] h-[18px] rounded-full ring-2 ring-[var(--card)] shadow-sm"
          style={{
            background: `conic-gradient(${active.colors[0]} 0deg 120deg, ${active.colors[1]} 120deg 240deg, ${active.colors[2]} 240deg 360deg)`,
          }}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-5 z-50"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl p-5 w-full max-w-sm shadow-xl animate-[fadeIn_0.15s_ease-out]"
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-ledger text-lg">Pilih tema tampilan</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--paper)] shrink-0 -mt-1 -mr-1 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mb-4">Tema tersimpan otomatis di perangkat ini.</p>
            <div className="flex flex-col gap-2">
              {THEMES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                    theme === t.id
                      ? "border-[var(--gold)] bg-[var(--paper)] shadow-sm"
                      : "border-[var(--paper-line)] hover:border-[var(--gold)]/50"
                  }`}
                >
                  <div
                    className="flex rounded-full overflow-hidden shrink-0 ring-1 ring-black/10"
                    style={{ width: 28, height: 28 }}
                  >
                    {t.colors.map((c, i) => (
                      <div key={i} style={{ backgroundColor: c, width: 28 / t.colors.length, height: 28 }} />
                    ))}
                  </div>
                  <span className="text-sm font-medium flex-1">{t.label}</span>
                  {theme === t.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--gold)] shrink-0">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
