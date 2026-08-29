"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ThemeSwitcher from "../ThemeSwitcher";

const LAST_BACKUP_KEY = "buku-hutang-gh-last-backup";

export default function BackupPage() {
  const router = useRouter();

  const [session, setSession] = useState(undefined); // undefined = belum dicek
  const [busy, setBusy] = useState(null); // "backup" | "restore" | null
  const [status, setStatus] = useState(null); // { type: "ok"|"error", text }
  const [lastBackup, setLastBackup] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      } else {
        setSession(data.session);
      }
    });
  }, [router]);

  useEffect(() => {
    setLastBackup(localStorage.getItem(LAST_BACKUP_KEY));
  }, []);

  async function callApi(path) {
    const res = await fetch(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Terjadi kesalahan (status ${res.status})`);
    return json;
  }

  async function handleBackup() {
    setBusy("backup");
    setStatus(null);
    try {
      const json = await callApi("/api/backup");
      const now = new Date().toISOString();
      localStorage.setItem(LAST_BACKUP_KEY, now);
      setLastBackup(now);
      setStatus({ type: "ok", text: `Backup berhasil (${json.totalRows} baris data) disimpan ke GitHub.` });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    if (!confirmRestore) {
      setConfirmRestore(true);
      return;
    }
    setConfirmRestore(false);
    setBusy("restore");
    setStatus(null);
    try {
      const json = await callApi("/api/restore");
      setStatus({
        type: "ok",
        text: `Restore selesai (${json.totalRows} baris dipulihkan). Muat ulang halaman utama untuk melihat data terbaru.`,
      });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(null);
    }
  }

  if (session === undefined) {
    return <div className="max-w-md mx-auto px-6 py-16 text-center text-[var(--ink-soft)]">Memuat…</div>;
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-16">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="font-ledger text-2xl leading-none">Backup &amp; Restore</h1>
          <p className="text-xs text-[var(--ink-soft)] mt-1.5">Simpan &amp; pulihkan data lewat GitHub</p>
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

      <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-[18px] p-4 mb-4 shadow-sm">
        <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
          Data diambil dari akun yang sedang login (dilindungi Row Level Security Supabase), lalu server aplikasi
          menyimpannya sebagai satu file JSON ke repository GitHub yang sudah dikonfigurasi lewat environment
          variable. Token GitHub tidak pernah dikirim ke atau disimpan di browser.
        </p>
      </div>

      {status && (
        <div
          className={`rounded-xl px-3 py-2.5 mb-4 text-xs leading-relaxed ${
            status.type === "ok"
              ? "bg-[var(--green-soft,rgba(34,197,94,0.12))] text-[var(--ink)]"
              : "bg-[var(--red-soft)] text-[var(--red)]"
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={handleBackup}
          disabled={busy !== null}
          className="w-full py-3 rounded-xl bg-[var(--ink)] text-[var(--card)] text-sm font-semibold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {busy === "backup" ? "Membackup data…" : "⬆️ Backup ke GitHub"}
        </button>

        <button
          onClick={handleRestore}
          disabled={busy !== null}
          className={`w-full py-3 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 ${
            confirmRestore
              ? "bg-[var(--red)] text-white"
              : "bg-[var(--card)] border border-[var(--paper-line)] text-[var(--ink)]"
          }`}
        >
          {busy === "restore"
            ? "Memulihkan data…"
            : confirmRestore
            ? "Yakin? Tekan sekali lagi untuk restore"
            : "⬇️ Restore dari GitHub"}
        </button>
        {confirmRestore && (
          <button
            onClick={() => setConfirmRestore(false)}
            className="text-xs text-[var(--ink-soft)] -mt-2 underline self-center"
          >
            Batal restore
          </button>
        )}
      </div>

      {lastBackup && (
        <p className="text-[11px] text-[var(--ink-soft)] text-center mt-4">
          Backup terakhir dari perangkat ini: {new Date(lastBackup).toLocaleString("id-ID")}
        </p>
      )}

      <p className="text-[10.5px] text-[var(--ink-soft)] text-center mt-2 leading-relaxed">
        Restore menimpa baris yang sudah ada berdasarkan ID dan menambahkan baris yang belum ada. Baris yang dibuat
        setelah backup terakhir tidak akan terhapus oleh restore.
      </p>
    </div>
  );
}
