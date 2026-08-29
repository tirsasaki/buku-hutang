"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      setError("Gagal mengirim email reset, coba lagi.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm text-center">
          <h1 className="font-ledger text-xl mb-2">Cek email Anda</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Kalau <b>{email}</b> terdaftar, kami sudah kirim link untuk membuat password baru. Buka email itu dan ikuti link-nya.
          </p>
          <Link href="/login" className="inline-block mt-4 text-sm underline text-[var(--ink)]">
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleReset}
        className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm"
      >
        <h1 className="font-ledger text-2xl mb-1">Lupa password</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-5">Masukkan email akun Anda, kami kirim link untuk membuat password baru</p>

        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--surface-soft)] text-sm outline-none focus:border-[var(--gold)]"
          />
        </div>

        {error && <p className="text-xs text-[var(--red)] mb-3">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[var(--action-bg)] text-[var(--action-text)] font-semibold text-sm disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim link reset"}
        </button>

        <p className="text-xs text-[var(--ink-soft)] text-center mt-4">
          <Link href="/login" className="underline text-[var(--ink)]">
            Kembali ke halaman login
          </Link>
        </p>
      </form>
    </div>
  );
}
