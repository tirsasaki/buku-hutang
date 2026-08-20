"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Kalau session recovery sudah terpasang lebih dulu sebelum listener aktif
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi tidak sama.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Gagal mengubah password, coba lagi.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1500);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm text-center">
          <h1 className="font-ledger text-xl mb-2">Password berhasil diubah</h1>
          <p className="text-sm text-[var(--ink-soft)]">Mengalihkan Anda ke aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm text-center">
          <h1 className="font-ledger text-xl mb-2">Memeriksa link...</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Kalau halaman ini tidak berubah dalam beberapa detik, link reset Anda mungkin sudah kedaluwarsa. Coba minta link baru dari halaman lupa password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleUpdatePassword}
        className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm"
      >
        <h1 className="font-ledger text-2xl mb-1">Buat password baru</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-5">Masukkan password baru untuk akun Anda</p>

        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Password baru</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-white text-sm outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Ulangi password baru</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-white text-sm outline-none focus:border-[var(--gold)]"
          />
        </div>

        {error && <p className="text-xs text-[var(--red)] mb-3">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan password baru"}
        </button>
      </form>
    </div>
  );
}
