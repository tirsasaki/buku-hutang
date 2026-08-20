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
export default function ThemeSwitcher({ className = "" }) {
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Ganti tema"
        className={`w-9 h-9 rounded-full border border-[var(--paper-line)] bg-[var(--card)] shadow-sm flex items-center justify-center shrink-0 hover:border-[var(--gold)] hover:shadow-md active:scale-90 transition-all duration-200 ${className}`}
      >
        <span
          className="block w-4 h-4 rounded-full ring-1 ring-black/10"
          style={{
            background: `conic-gradient(${active.colors[0]} 0deg 120deg, ${active.colors[1]} 120deg 240deg, ${active.colors[2]} 240deg 360deg)`,
          }}
        />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-[var(--card)] rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-ledger text-lg mb-1">Pilih tema tampilan</h2>
            <p className="text-xs text-[var(--ink-soft)] mb-4">Tema tersimpan otomatis di perangkat ini.</p>
            <div className="flex flex-col gap-2">
              {THEMES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    theme === t.id ? "border-[var(--gold)]" : "border-[var(--paper-line)]"
                  }`}
                >
                  <div className="flex rounded-full overflow-hidden shrink-0" style={{ width: 28, height: 28 }}>
                    {t.colors.map((c, i) => (
                      <div key={i} style={{ backgroundColor: c, width: 28 / t.colors.length, height: 28 }} />
                    ))}
                  </div>
                  <span className="text-sm font-medium flex-1">{t.label}</span>
                  {theme === t.id && <span className="text-xs text-[var(--gold)] font-semibold">Aktif</span>}
                </div>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-4 py-2 rounded-lg border border-[var(--paper-line)] text-sm text-[var(--ink-soft)]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
