'use strict';

/**
 * Memeriksa kesiapan repositori untuk aplikasi "Codex for Open Source"
 * memakai GitHub REST API (tanpa dependensi, memakai fetch bawaan Node 18+).
 *
 * Pemakaian:
 *   node scripts/siap-aplikasi.js
 *   GITHUB_TOKEN=ghp_xxx node scripts/siap-aplikasi.js   # hindari batas 60 req/jam
 *   node scripts/siap-aplikasi.js --repo https://github.com/user/repo
 *
 * Keluar dengan kode 1 bila ada butir WAJIB yang belum siap.
 */

const DEFAULT_REPO = 'Sanzduw2026/CODEX';
const API = 'https://api.github.com';

function parseArgs(argv) {
  const out = { repo: DEFAULT_REPO };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo') out.repo = argv[++i];
    else if (arg === '--insecure') out.insecure = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error(`argumen tidak dikenal: ${arg}`);
  }
  out.repo = String(out.repo)
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(out.repo)) {
    throw new Error(`format repo tidak valid: ${out.repo} (harus owner/nama)`);
  }
  return out;
}

async function gh(path, token) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'ide-codex-kesiapan' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 404) return { __missing: true, status: 404 };
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    throw new Error(
      `GitHub API menolak (${res.status}). Sisa kuota: ${remaining}. `
      + 'Setel GITHUB_TOKEN untuk kuota lebih besar.',
    );
  }
  if (!res.ok) throw new Error(`GitHub API ${path} → HTTP ${res.status}`);
  return res.json();
}

function line(status, label, detail) {
  const mark = status === 'ok' ? '✅' : status === 'warn' ? '⚠️ ' : '❌';
  return `${mark} ${label}${detail ? ` — ${detail}` : ''}`;
}

async function periksa(repo, token) {
  const [info, releases, issues, readme] = await Promise.all([
    gh(`/repos/${repo}`, token),
    gh(`/repos/${repo}/releases?per_page=1`, token),
    gh(`/repos/${repo}/issues?state=all&per_page=100`, token),
    gh(`/repos/${repo}/readme`, token),
  ]);

  if (info.__missing) throw new Error(`repo tidak ditemukan atau privat: ${repo}`);

  const checks = [];
  const add = (wajib, status, label, detail) => checks.push({ wajib, status, label, detail });

  add(true, info.private ? 'fail' : 'ok', 'Repositori publik',
    info.private ? 'atur ke public di Settings → General → Danger Zone' : info.full_name);

  add(false, info.has_issues ? 'ok' : 'fail', 'Issues aktif',
    info.has_issues ? 'aktif' : 'nyalakan di Settings → General → Features');

  add(false, info.has_discussions ? 'ok' : 'warn', 'Discussions aktif',
    info.has_discussions ? 'aktif' : 'Settings → General → Features → Discussions');

  add(false, readme.__missing ? 'fail' : 'ok', 'README ada',
    readme.__missing ? 'tambahkan README.md' : 'terbaca');

  const releasesArr = Array.isArray(releases) ? releases : [];
  add(false, releasesArr.length ? 'ok' : 'warn', 'Rilis/tag',
    releasesArr.length
      ? `${releasesArr[0].tag_name} (${releasesArr[0].published_at?.slice(0, 10) ?? '-'})`
      : 'belum ada rilis — buat v1.0.0 untuk sinyal pemeliharaan');

  const issuesArr = Array.isArray(issues) ? issues : [];
  const realIssues = issuesArr.filter((i) => !i.pull_request && i.state === 'open');
  const closedIssues = issuesArr.filter((i) => !i.pull_request && i.state === 'closed');
  const prs = issuesArr.filter((i) => i.pull_request);
  add(false, realIssues.length ? 'ok' : 'warn', 'Issue terbuka',
    realIssues.length ? `${realIssues.length} issue` : 'belum ada issue — satu issue roadmap membantu');

  add(false, closedIssues.length ? 'ok' : 'warn', 'Issue terselesaikan',
    closedIssues.length
      ? `${closedIssues.length} issue ditutup (bukti siklus kerja)`
      : 'belum ada issue yang ditutup — selesaikan satu issue untuk bukti siklus kerja');

  add(false, prs.length >= 1 ? 'ok' : 'warn', 'Aktivitas PR',
    `${prs.length} PR (termasuk yang sudah merged)`);

  const pushed = new Date(info.pushed_at);
  const days = Math.floor((Date.now() - pushed.getTime()) / 86400000);
  add(false, days <= 30 ? 'ok' : 'warn', 'Commit terakhir',
    `${days} hari lalu (${info.pushed_at?.slice(0, 10)})`);

  const stars = info.stargazers_count ?? 0;
  add(false, stars >= 10 ? 'ok' : 'warn', 'Bintang',
    `${stars} — bukan syarat resmi, tetapi menambah bukti pemakaian`);

  add(false, info.license?.spdx_id && info.license.spdx_id !== 'NOASSERTION' ? 'ok' : 'warn',
    'Lisensi', info.license?.spdx_id || 'belum terdeteksi GitHub');

  return { info, checks };
}

function ringkas({ info, checks }) {
  const out = [];
  out.push(`Repo: ${info.full_name}  (bintang ${info.stargazers_count}, fork ${info.forks_count})`);
  out.push('');
  for (const c of checks) {
    out.push(line(c.status, c.label, c.detail));
  }
  const wajibGagal = checks.filter((c) => c.wajib && c.status !== 'ok');
  const perhatian = checks.filter((c) => !c.wajib && c.status !== 'ok');
  out.push('');
  if (wajibGagal.length === 0) {
    out.push(`Siap diajukan. ${perhatian.length} butir opsional bisa ditingkatkan, tetapi tidak menghalangi.`);
  } else {
    out.push(`Belum siap: ${wajibGagal.map((c) => c.label).join(', ')}.`);
  }
  out.push('');
  out.push('Ajukan: https://openai.com/form/codex-for-oss/');
  out.push('Isian siap salin: docs/aplikasi-field.md');
  return out.join('\n');
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write('Pemakaian: node scripts/siap-aplikasi.js [--repo owner/nama] [--insecure]\n');
    return 0;
  }
  if (args.insecure) {
    // Hanya untuk sandbox dengan certificate store tidak lengkap (mis. container minim).
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.stderr.write('Peringatan: verifikasi TLS dimatikan (--insecure). Jangan dipakai di mesin kerja.\n');
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  try {
    const hasil = await periksa(args.repo, token);
    process.stdout.write(`${ringkas(hasil)}\n`);
    return hasil.checks.some((c) => c.wajib && c.status !== 'ok') ? 1 : 0;
  } catch (error) {
    const hint = /fetch failed|UNABLE_TO_VERIFY|certificate/i.test(error.message)
      ? ' Periksa koneksi internet. Bila sertifikat sistem tidak lengkap, jalankan dengan --insecure.'
      : '';
    process.stderr.write(`Gagal memeriksa: ${error.message}.${hint}\n`);
    return 1;
  }
}

if (require.main === module) {
  main().then((code) => { process.exitCode = code; });
}

module.exports = { main, parseArgs, periksa, ringkas, line };
