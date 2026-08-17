import "./globals.css";

export const metadata = {
  title: "Buku Hutang",
  description: "Catatan hutang pelanggan",
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
           &copy; 2026 Tirsasaki.
        </footer>
      </body>
    </html>
  );
}