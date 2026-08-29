"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ThemeSwitcher from "../ThemeSwitcher";

const DEFAULT_KASIR = ["Saya", "Fuji", "Ibu"];

function initialsOf(name, email) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return src.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();

  const [session, setSession] = useState(undefined); // undefined = belum dicek
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [kasirNames, setKasirNames] = useState(DEFAULT_KASIR);
  const [newKasir, setNewKasir] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null); // { type, text }
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const user = data.session.user;
      setSession(data.session);
      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setOriginalEmail(user.email || "");
      const savedKasir = user.user_metadata?.kasir_names;
      setKasirNames(Array.isArray(savedKasir) && savedKasir.length > 0 ? savedKasir : DEFAULT_KASIR);
    });
  }, [router]);

  function addKasir() {
    const trimmed = newKasir.trim();
    if (!trimmed) return;
    if (kasirNames.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setNewKasir("");
      return;
    }
    setKasirNames((prev) => [...prev, trimmed]);
    setNewKasir("");
  }

  function removeKasir(nameToRemove) {
    setKasirNames((prev) => prev.filter((k) => k !== nameToRemove));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus(null);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim(), kasir_names: kasirNames },
    });
    setSavingProfile(false);
    if (error) {
      setProfileStatus({ type: "error", text: "Gagal menyimpan profil. Coba lagi." });
    } else {
      setProfileStatus({ type: "ok", text: "Profil tersimpan." });
    }
  }

  async function handleSaveEmail(e) {
    e.preventDefault();
    if (email.trim() === originalEmail) return;
    setSavingEmail(true);
    setEmailStatus(null);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setSavingEmail(false);
    if (error) {
      setEmailStatus({ type: "error", text: error.message || "Gagal mengubah email." });
    } else {
      setEmailStatus({
        type: "ok",
        text: "Link konfirmasi sudah dikirim ke email lama & baru. Email baru aktif setelah dikonfirmasi.",
      });
    }
  }

  if (session === undefined) {
    return <div className="max-w-md mx-auto px-6 py-16 text-center text-[var(--ink-soft)]">Memuat…</div>;
  }

  const memberSince = session.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-16">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="font-ledger text-2xl leading-none">Profil</h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1.5">Kelola akun & nama kasir</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="plain" />
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-full border border-[var(--paper-line)] bg-[var(--card)] flex items-center justify-center shrink-0 hover:border-[var(--gold)] active:scale-90 transition-all"
            title="Kembali"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Kartu identitas */}
      <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--paper-line)] rounded-[18px] p-4 mb-4 shadow-sm">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "var(--ink)" }}
        >
          {initialsOf(name, email)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name || "Belum ada nama"}</p>
          <p className="text-xs text-[var(--ink-soft)] truncate">{originalEmail}</p>
          {memberSince && <p className="text-[10.5px] text-[var(--ink-faint)] mt-0.5">Bergabung sejak {memberSince}</p>}
        </div>
      </div>

      {/* Nama & Kasir */}
      <form onSubmit={handleSaveProfile} className="bg-[var(--card)] border border-[var(--paper-line)] rounded-[18px] p-4 mb-4 shadow-sm">
        <h2 className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-3">Informasi Profil</h2>

        <div className="mb-4">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
          />
        </div>

        <div className="mb-1">
          <label className="block text-xs text-[var(--ink-soft)] mb-1 font-medium">Nama Kasir</label>
          <p className="text-[10.5px] text-[var(--ink-faint)] mb-2">
            Daftar nama yang muncul sebagai pilihan cepat saat mencatat hutang.
          </p>
          <div className="flex gap-2 flex-wrap mb-2">
            {kasirNames.map((k) => (
              <div
                key={k}
                className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full border border-[var(--paper-line)] text-xs text-[var(--ink-soft)]"
              >
                {k}
                <button
                  type="button"
                  onClick={() => removeKasir(k)}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--red-soft)] hover:text-[var(--red)] transition-colors"
                  title={`Hapus ${k}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            {kasirNames.length === 0 && <p className="text-xs text-[var(--ink-faint)] italic">Belum ada nama kasir</p>}
          </div>
          <div className="flex gap-2">
            <input
              value={newKasir}
              onChange={(e) => setNewKasir(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKasir();
                }
              }}
              placeholder="Tambah nama kasir baru"
              className="flex-1 px-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
            />
            <button
              type="button"
              onClick={addKasir}
              className="px-4 rounded-xl border border-[var(--paper-line)] text-sm font-medium text-[var(--ink)] hover:border-[var(--gold)] active:scale-95 transition-all"
            >
              Tambah
            </button>
          </div>
        </div>

        {profileStatus && (
          <div
            className={`rounded-xl px-3 py-2.5 mt-4 text-xs leading-relaxed ${
              profileStatus.type === "ok" ? "bg-[var(--green-soft,rgba(34,197,94,0.12))] text-[var(--ink)]" : "bg-[var(--red-soft)] text-[var(--red)]"
            }`}
          >
            {profileStatus.text}
          </div>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="w-full mt-4 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--card)] text-sm font-semibold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {savingProfile ? "Menyimpan…" : "Simpan Profil"}
        </button>
      </form>

      {/* Email */}
      <form onSubmit={handleSaveEmail} className="bg-[var(--card)] border border-[var(--paper-line)] rounded-[18px] p-4 mb-4 shadow-sm">
        <h2 className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wide mb-3">Email</h2>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--paper-line)] bg-[var(--paper)] text-sm outline-none focus:border-[var(--gold)] transition-colors"
        />
        {emailStatus && (
          <div
            className={`rounded-xl px-3 py-2.5 mt-3 text-xs leading-relaxed ${
              emailStatus.type === "ok" ? "bg-[var(--green-soft,rgba(34,197,94,0.12))] text-[var(--ink)]" : "bg-[var(--red-soft)] text-[var(--red)]"
            }`}
          >
            {emailStatus.text}
          </div>
        )}
        <button
          type="submit"
          disabled={savingEmail || email.trim() === originalEmail}
          className="w-full mt-3 py-2.5 rounded-xl border border-[var(--paper-line)] text-sm font-semibold text-[var(--ink)] hover:border-[var(--gold)] active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {savingEmail ? "Mengirim konfirmasi…" : "Ubah Email"}
        </button>
      </form>

      <p className="text-[10.5px] text-[var(--ink-faint)] text-center leading-relaxed">
        Ingin ganti password? Buka halaman{" "}
        <button onClick={() => router.push("/forgot-password")} className="underline">
          lupa password
        </button>
        .
      </p>
    </div>
  );
}
