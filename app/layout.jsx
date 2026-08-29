import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import RegisterSW from "./RegisterSW";
import { Special_Elite, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";

// next/font men-download font ini sekali saat build dan menyajikannya dari
// domain sendiri (self-hosted) — menghilangkan request eksternal ke
// fonts.googleapis.com/fonts.gstatic.com yang sebelumnya jadi render-blocking
// request paling mahal di laporan PageSpeed (~1.670ms).
const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-elite",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

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
    <html
      lang="id"
      suppressHydrationWarning
      className={`${specialElite.variable} ${plusJakartaSans.variable} ${ibmPlexMono.variable}`}
    >
      <head>
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
