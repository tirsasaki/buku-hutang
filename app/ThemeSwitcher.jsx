"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "buku-hutang-theme";

// Migrasi nilai tema lama (5-tema) ke sistem baru yang hanya punya light/dark.
function migrateThemeValue(value) {
  if (value === "light" || value === "dark") return value;
  if (value === "klasik" || value === "lavender") return "light";
  if (value === "malam" || value === "zamrud" || value === "kopi") return "dark";
  return null;
}

function getPreferredTheme() {
  const saved = migrateThemeValue(localStorage.getItem(STORAGE_KEY));
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Tombol tunggal untuk beralih antara Light Mode dan Dark Mode. Dipakai
// bersama di halaman utama, login, & daftar.
export default function ThemeSwitcher({ className = "", variant = "default" }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const resolved = getPreferredTheme();
    setTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, resolved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap";

  const triggerClass =
    variant === "plain"
      ? "w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-[var(--surface-soft)] active:scale-90 transition-all duration-200"
      : "w-9 h-9 rounded-full border border-[var(--paper-line)] bg-[var(--card)] shadow-sm flex items-center justify-center shrink-0 hover:border-[var(--gold)] hover:shadow-md active:scale-90 transition-all duration-200";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`${triggerClass} ${className}`}
    >
      <span className="relative block w-[18px] h-[18px] overflow-hidden">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute inset-0 text-[var(--gold)] transition-all duration-300 ease-out"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
          }}
        >
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.55 1.55M7.15 16.85 5.6 18.4M18.4 18.4l-1.55-1.55M7.15 7.15 5.6 5.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="absolute inset-0 text-[var(--ink-soft)] transition-all duration-300 ease-out"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
          }}
        >
          <path
            d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
