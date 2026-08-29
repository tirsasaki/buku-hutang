// Helper untuk backup & restore data ke GitHub lewat GitHub Contents API.
// Semua request jalan langsung dari browser pengguna ke api.github.com —
// token GitHub TIDAK PERNAH dikirim ke server aplikasi ini, hanya disimpan
// di localStorage perangkat pengguna sendiri.

const GITHUB_API = "https://api.github.com";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Encode/decode UTF-8 aman ke base64 (btoa bawaan browser tidak tahan
// karakter non-ASCII seperti nama pelanggan dengan emoji/aksen).
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Ambil isi file backup dari repo GitHub.
 * Mengembalikan { data, sha } atau null jika file belum pernah ada.
 */
export async function fetchBackupFromGithub({ token, repo, path, branch }) {
  const url = `${GITHUB_API}/repos/${repo}/contents/${path}${branch ? `?ref=${branch}` : ""}`;
  const res = await fetch(url, { headers: authHeaders(token) });

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Gagal mengambil backup (status ${res.status})`);
  }

  const json = await res.json();
  const content = JSON.parse(base64ToUtf8(json.content));
  return { data: content, sha: json.sha };
}

/**
 * Simpan (buat/replace) file backup di repo GitHub.
 */
export async function uploadBackupToGithub({ token, repo, path, branch, data, message }) {
  // Cek dulu apakah file sudah ada, untuk dapat sha (wajib buat overwrite).
  let sha;
  try {
    const existing = await fetchBackupFromGithub({ token, repo, path, branch });
    sha = existing?.sha;
  } catch (e) {
    // Jika gagal karena alasan selain "belum ada", lempar lagi.
    if (!String(e.message).includes("404")) throw e;
  }

  const url = `${GITHUB_API}/repos/${repo}/contents/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message || `Backup Buku Hutang — ${new Date().toISOString()}`,
      content: utf8ToBase64(JSON.stringify(data, null, 2)),
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Gagal upload backup (status ${res.status})`);
  }

  return res.json();
}

/**
 * Validasi ringan bahwa token & repo bisa diakses sebelum dipakai.
 */
export async function verifyGithubAccess({ token, repo }) {
  const res = await fetch(`${GITHUB_API}/repos/${repo}`, { headers: authHeaders(token) });
  if (res.status === 404) {
    throw new Error("Repo tidak ditemukan, atau token tidak punya akses ke repo ini.");
  }
  if (res.status === 401) {
    throw new Error("Token GitHub tidak valid atau sudah kedaluwarsa.");
  }
  if (!res.ok) {
    throw new Error(`Gagal terhubung ke GitHub (status ${res.status})`);
  }
  const json = await res.json();
  if (json.permissions && !json.permissions.push) {
    throw new Error("Token tidak punya izin tulis (push) ke repo ini.");
  }
  return true;
}
