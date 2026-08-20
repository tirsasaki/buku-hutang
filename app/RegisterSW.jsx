"use client";

import { useEffect } from "react";

// Mendaftarkan service worker sekaligus memastikan versi baru (mis. fitur
// baru seperti tombol ganti tema) langsung terpakai begitu ada deploy baru,
// alih-alih tersangkut di cache lama sampai pengguna hapus cache manual.
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloaded = false;
    const reloadOnce = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Kalau ada SW baru "menunggu" (sudah terpasang tapi belum aktif
      // karena tab lama masih terbuka), langsung suruh dia aktif.
      if (registration.waiting) {
        registration.waiting.postMessage("SKIP_WAITING");
      }

      // Cek pembaruan tiap kali tab ini dibuka/difokuskan lagi, supaya
      // update terdeteksi lebih cepat dari sekadar menunggu interval Next.js.
      registration.update().catch(() => {});

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            newWorker.postMessage("SKIP_WAITING");
          }
        });
      });
    }).catch(() => {});

    // Begitu service worker baru resmi mengambil alih, muat ulang sekali
    // supaya halaman yang tampil adalah build terbaru.
    navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reloadOnce);
    };
  }, []);
  return null;
}
