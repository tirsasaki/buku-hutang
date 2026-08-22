import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import RegisterSW from "./RegisterSW";

export const metadata = {
  title: "Buku Hutang",
  description: "Catatan hutang pelanggan",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Buku Hutang",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0E131A" },
  ],
};

// Skrip inisialisasi tema: dijalankan sebelum halaman terlihat agar tidak
// ada kedipan (flash) antara Light dan Dark Mode. Juga memigrasikan nilai
// tema lama (5-tema) yang mungkin masih tersimpan di perangkat pengguna.
const themeInitScript = `
(function () {
  try {
    var STORAGE_KEY = "buku-hutang-theme";
    var LIGHT_ALIASES = ["klasik", "lavender"];
    var DARK_ALIASES = ["malam", "zamrud", "kopi"];
    var raw = localStorage.getItem(STORAGE_KEY);
    var resolved = null;
    if (raw === "light" || raw === "dark") {
      resolved = raw;
    } else if (LIGHT_ALIASES.indexOf(raw) !== -1) {
      resolved = "light";
    } else if (DARK_ALIASES.indexOf(raw) !== -1) {
      resolved = "dark";
    } else {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, resolved);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <footer className="mt-6">
          <div className="max-w-md mx-auto px-6">
            <div className="h-px" style={{ background: "var(--paper-line)" }} />
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap px-4 py-5 text-center">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold tracking-tight shrink-0"
              style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
            >
              TS
            </div>
            <span className="text-[11.5px] text-[var(--ink-soft)]">
              Dibuat oleh <span className="font-medium text-[var(--ink)]">tirsasaki</span>
            </span>
            <span className="text-[10px]" style={{ color: "var(--paper-line)" }}>
              &#9679;
            </span>
            <span className="font-mono-num text-[11px] text-[var(--ink-soft)]">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
        </footer>
        <Analytics />
        <RegisterSW />
      </body>
    </html>
  );
}
