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
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>

      {/* Panel sampul — identitas "buku besar" */}
      <div
        className="ledger-cover-texture relative overflow-hidden flex flex-col justify-between px-7 py-9 lg:w-[44%] lg:px-14 lg:py-16"
        style={{ background: "var(--ink)" }}
      >
        {/* garis jahitan di tepi kanan, hanya terlihat di layar besar */}
        <div
          className="hidden lg:block absolute top-0 bottom-0 right-6 border-r-2 border-dashed opacity-25"
          style={{ borderColor: "var(--paper)" }}
        />

        <div className="animate-slide-left">
          <span
            className="text-[10px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: "var(--gold)" }}
          >
            Pembukuan Digital
          </span>
          <h1
            className="font-ledger text-3xl lg:text-[2.75rem] leading-tight mt-3"
            style={{ color: "var(--paper)" }}
          >
            Buku
            <br className="hidden lg:block" /> Hutang
          </h1>
          <p
            className="text-sm mt-3 max-w-[26ch]"
            style={{ color: "var(--paper)", opacity: 0.65 }}
          >
            Setiap piutang tercatat rapi, setiap pelanggan mudah ditelusuri.
          </p>
        </div>

        {/* Stempel tinta — elemen tanda tangan halaman ini */}
        <div className="hidden lg:flex items-end justify-between mt-10 animate-slide-left">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 160 160" className="w-24 h-24 shrink-0 animate-stamp" aria-hidden="true">
              <g className="stamp-ring">
                <path
                  id="stampCirclePath"
                  d="M 80,80 m -58,0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0"
                  fill="none"
                />
                <text fontSize="9.5" letterSpacing="3" fill="var(--paper)" opacity="0.7">
                  <textPath href="#stampCirclePath" startOffset="2%">
                    TERCATAT &#8226; TERPERCAYA &#8226; RAPI &#8226;
                  </textPath>
                </text>
              </g>
              <circle
                cx="80"
                cy="80"
                r="34"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeDasharray="2.5 3.5"
                opacity="0.9"
              />
              <path
                d="M63 81 L74 92 L98 66"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-xs leading-relaxed max-w-[16ch]" style={{ color: "var(--paper)", opacity: 0.55 }}>
              Data tersimpan aman di cloud, bisa diakses kapan saja.
            </p>
          </div>
        </div>
      </div>

      {/* Panel form */}
      <div
        className="flex-1 flex items-center justify-center px-5 py-10 lg:px-12"
        style={{ background: "var(--paper)" }}
      >
        <div className="w-full max-w-sm animate-slide-right">
          <div className="paper-torn-top">
            <form
              onSubmit={handleLogin}
              className="rounded-b-2xl border border-t-0 shadow-xl p-6 pt-8 sm:p-8 sm:pt-9"
              style={{ background: "var(--card)", borderColor: "var(--paper-line)" }}
            >
              <h2 className="font-ledger text-xl mb-1">Selamat datang kembali</h2>
              <p className="text-sm text-[var(--ink-soft)] mb-6">
                Masuk untuk mengelola catatan hutang kamu
              </p>

              <div className="mb-4">
                <label className="block text-xs text-[var(--ink-soft)] mb-1.5 font-medium">
                  Email
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] pointer-events-none"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-[var(--paper)] text-sm outline-none transition-all duration-150 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                    style={{ borderColor: "var(--paper-line)" }}
                  />
                </div>
              </div>

              <div className="mb-1.5">
                <label className="block text-xs text-[var(--ink-soft)] mb-1.5 font-medium">
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] pointer-events-none"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect x="5" y="10.5" width="14" height="9" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border bg-[var(--paper)] text-sm outline-none transition-all duration-150 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                    style={{ borderColor: "var(--paper-line)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors p-1"
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
                <div className="text-right mt-1.5">
                  <Link href="/forgot-password" className="text-[11px] text-[var(--ink-soft)] hover:text-[var(--gold)] underline transition-colors">
                    Lupa password?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="text-xs text-[var(--red)] bg-[var(--red-soft)] rounded-lg px-3 py-2 mt-3">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-2.5 rounded-lg font-semibold text-sm mt-5 transition-all duration-150 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                {loading ? "Masuk..." : "Masuk"}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1" style={{ background: "var(--paper-line)" }} />
                <span className="text-[10px] uppercase tracking-widest text-[var(--ink-soft)]">atau</span>
                <div className="h-px flex-1" style={{ background: "var(--paper-line)" }} />
              </div>

              <p className="text-xs text-[var(--ink-soft)] text-center">
                Belum punya akun?{" "}
                <Link href="/signup" className="underline font-medium" style={{ color: "var(--ink)" }}>
                  Daftar gratis
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
