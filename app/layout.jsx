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
        <footer className="text-center text-[11.5px] text-[var(--ink-soft)] py-4 opacity-70">
          Dibuat oleh Tirsasaki &copy; 2026
        </footer>
        <Analytics />
        <RegisterSW />
      </body>
    </html>
  );
}
