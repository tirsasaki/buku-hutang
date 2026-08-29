// Naikkan angka versi ini setiap ada perubahan besar pada tampilan/fitur
// (mis. penambahan fitur baru seperti ganti tema), supaya cache lama
// otomatis dibuang dan pengguna PWA yang sudah pernah install tidak
// terjebak melihat versi lama.
const CACHE_NAME = "buku-hutang-v3";
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Izinkan halaman meminta service worker baru langsung aktif (dipakai oleh
// RegisterSW.jsx saat mendeteksi update, supaya versi baru langsung dipakai
// tanpa menunggu semua tab lama ditutup).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Network-first: selalu coba ambil data terbaru dulu (penting karena data hutang sering berubah),
// fallback ke cache hanya kalau benar-benar offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Cache API cuma mendukung skema http/https. Request dari browser extension
  // (mis. chrome-extension://) atau skema lain harus dilewati, kalau tidak
  // cache.put() akan throw dan memunculkan Uncaught TypeError di console.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Hanya tangani request same-origin (halaman, asset, API sendiri).
  // Request ke domain lain (Google Fonts, Vercel Insights, dll) sengaja TIDAK
  // di-intercept: kalau di-refetch lewat fetch() di dalam SW, request itu
  // dicek ulang terhadap CSP connect-src (bukan font-src/style-src seperti
  // request browser normal), jadi malah bisa keblokir walau domainnya sudah
  // diizinkan di font-src/style-src. Biarkan browser yang urus langsung.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // respondWith() wajib menerima Response yang valid — kalau cache pun
        // kosong (offline + belum pernah dibuka), kembalikan Response error
        // eksplisit alih-alih undefined (penyebab "Failed to convert value
        // to 'Response'" di console).
        return new Response("Offline dan halaman belum tersedia di cache.", {
          status: 503,
          statusText: "Service Unavailable",
        });
      })
  );
});
