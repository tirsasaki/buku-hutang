"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import ThemeSwitcher from "../ThemeSwitcher";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/");
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Memeriksa sesi...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      <form
        onSubmit={handleLogin}
        className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl shadow-sm p-6 w-full max-w-sm"
      >
        <h1 className="font-ledger text-2xl mb-1">Buku Hutang</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-5">Masuk untuk mengelola catatan hutang</p>

        <div className="mb-3">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)]"
          />
          <div className="text-right mt-1">
            <Link href="/forgot-password" className="text-[11px] text-[var(--ink-soft)] underline">
              Lupa password?
            </Link>
          </div>
        </div>

        {error && <p className="text-xs text-[var(--red)] mb-3">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm disabled:opacity-60"
        >
          {loading ? "Masuk..." : "Masuk"}
        </button>

        <p className="text-xs text-[var(--ink-soft)] text-center mt-4">
          Belum punya akun?{" "}
          <Link href="/signup" className="underline text-[var(--ink)]">
            Daftar gratis
          </Link>
        </p>
      </form>
    </div>
  );
}
