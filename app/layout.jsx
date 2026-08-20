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
  themeColor: "#2B3345",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
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
