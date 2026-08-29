import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchBackupFromGithub } from "../../../lib/githubBackup";

const TABLES = ["customers", "debt_items", "payments", "credit_transactions"];

function getScopedClient(accessToken) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function backupPathFor(userId) {
  const template = process.env.GITHUB_BACKUP_PATH || "backups/{user_id}.json";
  return template.replace("{user_id}", userId);
}

export async function POST(request) {
  try {
    const accessToken = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!accessToken) {
      return NextResponse.json({ error: "Belum login." }, { status: 401 });
    }

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_BACKUP_REPO) {
      return NextResponse.json(
        { error: "GITHUB_TOKEN / GITHUB_BACKUP_REPO belum diatur di environment server." },
        { status: 500 }
      );
    }

    const supabase = getScopedClient(accessToken);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });
    }
    const userId = userData.user.id;

    const path = backupPathFor(userId);
    const result = await fetchBackupFromGithub({
      token: process.env.GITHUB_TOKEN,
      repo: process.env.GITHUB_BACKUP_REPO,
      branch: process.env.GITHUB_BACKUP_BRANCH,
      path,
    });

    if (!result) {
      return NextResponse.json({ error: "Belum ada file backup untuk akun ini." }, { status: 404 });
    }

    const { tables } = result.data || {};
    if (!tables || typeof tables !== "object") {
      return NextResponse.json({ error: "Format file backup tidak dikenali." }, { status: 400 });
    }

    let totalRows = 0;
    for (const table of TABLES) {
      const rows = tables[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      // Paksa setiap baris tetap milik user yang sedang login, apa pun isi
      // file backup-nya — mencegah restore menimpa data milik user lain.
      const safeRows = rows.map((row) => ({ ...row, user_id: userId }));

      const { error } = await supabase.from(table).upsert(safeRows, { onConflict: "id" });
      if (error) {
        return NextResponse.json({ error: `Gagal restore tabel ${table}: ${error.message}` }, { status: 500 });
      }
      totalRows += safeRows.length;
    }

    return NextResponse.json({ ok: true, totalRows });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal restore." }, { status: 500 });
  }
}
