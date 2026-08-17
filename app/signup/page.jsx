"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message.includes("already registered") ? "Email ini sudah terdaftar." : "Gagal mendaftar, coba lagi.");
      return;
    }
    if (data.session) {
      router.push("/");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm text-center">
          <h1 className="font-ledger text-xl mb-2">Cek email Anda</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Kami sudah kirim link konfirmasi ke <b>{email}</b>. Buka email itu dan klik link-nya untuk mengaktifkan akun Anda.
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
        onSubmit={handleSignup}
        className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm"
      >
        <h1 className="font-ledger text-2xl mb-1">Buat akun baru</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-5">Mulai catat hutang pelanggan Anda sendiri, gratis</p>

        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-white text-sm outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-white text-sm outline-none focus:border-[var(--gold)]"
          />
          <p className="text-[11px] text-[var(--ink-soft)] mt-1">Minimal 6 karakter</p>
        </div>

        {error && <p className="text-xs text-[var(--red)] mb-3">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm disabled:opacity-60"
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>

        <p className="text-xs text-[var(--ink-soft)] text-center mt-4">
          Sudah punya akun?{" "}
          <Link href="/login" className="underline text-[var(--ink)]">
            Masuk di sini
          </Link>
        </p>
      </form>
    </div>
  );
}
