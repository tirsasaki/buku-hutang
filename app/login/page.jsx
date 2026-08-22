"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import ThemeSwitcher from "../ThemeSwitcher";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-5 py-14">
      <div className="absolute top-5 right-5 z-20">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-[380px] relative animate-rise">
        {/* Mark: lambang bulat dengan cincin cahaya lembut di belakangnya */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div
              aria-hidden="true"
              className="absolute inset-0 m-auto w-24 h-24 rounded-full blur-2xl pointer-events-none"
              style={{ background: "var(--gold)", opacity: 0.22 }}
            />
            <div className="relative w-14 h-14 rounded-2xl bg-[var(--action-bg)] flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 4.5h11a1.5 1.5 0 0 1 1.5 1.5v14l-3-1.8-2.5 1.8-2.5-1.8-2.5 1.8-2-1.4V6a1.5 1.5 0 0 1 1.5-1.5Z"
                  stroke="var(--action-text)"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M8.5 8.5h7M8.5 12h7" stroke="var(--action-text)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <h1 className="text-[26px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
            Selamat datang kembali
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--ink-soft)" }}>
            Masuk untuk kelola catatan hutang pelangganmu
          </p>
        </div>

        {/* Kartu form modern: flat, radius besar, tanpa dekorasi berlebih */}
        <div
          className="relative bg-[var(--card)] border border-[var(--paper-line)] rounded-[28px] shadow-xl p-6"
          style={{ boxShadow: "0 20px 45px -20px rgba(0,0,0,0.25)" }}
        >
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>
                Email
              </label>
              <div className="relative">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--ink-soft)" }}>
                  <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 6.5l8 6.5 8-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm outline-none border border-[var(--paper-line)] bg-[var(--surface-soft)] transition-all duration-150 focus:border-[var(--gold)]"
                  style={{ color: "var(--ink)" }}
                  onFocus={(e) => (e.target.style.boxShadow = "0 0 0 4px color-mix(in srgb, var(--gold) 16%, transparent)")}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
              </div>
            </div>

            <div className="mb-1.5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: "var(--ink)" }}>
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "var(--gold)" }}>
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--ink-soft)" }}>
                  <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl text-sm outline-none border border-[var(--paper-line)] bg-[var(--surface-soft)] transition-all duration-150 focus:border-[var(--gold)]"
                  style={{ color: "var(--ink)" }}
                  onFocus={(e) => (e.target.style.boxShadow = "0 0 0 4px color-mix(in srgb, var(--gold) 16%, transparent)")}
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0 transition-colors"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.3 5.3A9.7 9.7 0 0 1 12 5c5 0 8.5 4 9.9 7-.5 1.1-1.3 2.4-2.4 3.5M6.1 6.6C4.2 7.9 2.8 9.7 2.1 12c1.4 3 4.9 7 9.9 7 1.3 0 2.5-.3 3.6-.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M2.1 12S5.6 5 12 5s9.9 7 9.9 7-3.5 7-9.9 7-9.9-7-9.9-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs rounded-xl px-3.5 py-2.5 mt-4" style={{ color: "var(--red)", background: "var(--red-soft)" }}>
                {error}
              </p>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full mt-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-150 disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
              style={{ background: "var(--action-bg)", color: "var(--action-text)", boxShadow: "0 10px 25px -8px color-mix(in srgb, var(--action-bg) 45%, transparent)" }}
            >
              {loading ? (
                "Masuk..."
              ) : (
                <>
                  Masuk sekarang
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="transition-transform duration-150 group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-sm text-center mt-7" style={{ color: "var(--ink-soft)" }}>
          Belum punya akun?{" "}
          <Link href="/signup" className="font-semibold hover:underline" style={{ color: "var(--ink)" }}>
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
