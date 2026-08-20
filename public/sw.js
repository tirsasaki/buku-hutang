// Naikkan angka versi ini setiap ada perubahan besar pada tampilan/fitur
// (mis. penambahan fitur baru seperti ganti tema), supaya cache lama
// otomatis dibuang dan pengguna PWA yang sudah pernah install tidak
// terjebak melihat versi lama.
const CACHE_NAME = "buku-hutang-v2";
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
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
