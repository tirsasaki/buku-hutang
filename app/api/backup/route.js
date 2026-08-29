import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadBackupToGithub } from "../../../lib/githubBackup";

const TABLES = ["customers", "debt_items", "payments", "credit_transactions"];

// Client Supabase yang "berbicara sebagai" user pemilik access token (bukan
// service role) — Row Level Security tetap berlaku, jadi route ini hanya
// bisa membaca/menulis data milik user yang sedang login.
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

    const payload = { exported_at: new Date().toISOString(), user_id: userId, tables: {} };
    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
      if (error) {
        return NextResponse.json({ error: `Gagal membaca tabel ${table}: ${error.message}` }, { status: 500 });
      }
      payload.tables[table] = data || [];
    }

    const path = backupPathFor(userId);

    await uploadBackupToGithub({
      token: process.env.GITHUB_TOKEN,
      repo: process.env.GITHUB_BACKUP_REPO,
      branch: process.env.GITHUB_BACKUP_BRANCH,
      path,
      data: payload,
      message: `Backup Buku Hutang — ${new Date().toISOString()}`,
    });

    const totalRows = Object.values(payload.tables).reduce((sum, rows) => sum + rows.length, 0);
    return NextResponse.json({ ok: true, totalRows, path });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal backup." }, { status: 500 });
  }
}
