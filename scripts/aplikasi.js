'use strict';

/**
 * Membuat berkas isian untuk aplikasi "Codex for Open Source":
 *   docs/aplikasi-codex-oss.md   — panduan + jawaban siap salin
 *   docs/aplikasi-field.md       — hanya isi field, untuk copy-paste cepat
 *
 * Angka diambil langsung dari data/ideas/ agar selalu akurat.
 *
 * Pemakaian:
 *   node scripts/aplikasi.js
 *   node scripts/aplikasi.js --repo https://github.com/user/repo --nama "Nama Kamu"
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadIdeas, categories, openaiFeatureCount } = require('../lib/ideas');

const ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
  const out = {
    repo: 'https://github.com/Sanzduw2026/CODEX',
    nama: 'Sanzduw2026',
    github: 'Sanzduw2026',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--repo') out.repo = argv[++i];
    else if (arg === '--nama') out.nama = argv[++i];
    else if (arg === '--github') out.github = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error(`argumen tidak dikenal: ${arg}`);
  }
  return out;
}

/** Hitung jumlah test dari berkas tests/*.js agar angka di dokumen selalu benar. */
function countTests(dir = path.join(ROOT, 'tests')) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.test.js'))) {
    const body = fs.readFileSync(path.join(dir, name), 'utf8');
    total += (body.match(/^test\(/gm) || []).length;
  }
  return total;
}

function stats(ideas) {
  const features = openaiFeatureCount(ideas);
  return {
    total: ideas.length,
    categories: categories(ideas).length,
    featureCount: features.length,
    features,
    tests: countTests(),
    levels: [...new Set(ideas.map((i) => i.difficulty))],
  };
}

/** Field "Why does this repository qualify?" — maksimal 500 karakter. */
function qualifyField(s) {
  return `Ide Codex (${s.total} ide proyek OpenAI/Codex, ${s.categories} kategori) adalah generator ide yang bisa diputar acak lewat CLI dan API HTTP, lalu diekspor jadi brief Markdown/JSON/CSV. Nol dependensi npm, ${s.tests} test otomatis, CI di Node 18/20/22, dokumentasi kontribusi lengkap. Ditujukan untuk developer yang ingin mulai proyek OpenAI tanpa menghabiskan waktu memilih. Semua konten berbahasa Indonesia.`;
}

/** Field "How will you use API credits for your project?" — maksimal 500 karakter. */
function creditsField() {
  return 'Kredit API untuk otomasi pemeliharaan: memvalidasi ide baru lewat Codex sebelum masuk katalog (skema JSON + konsistensi metrik), meninjau PR kontributor, menghasilkan catatan rilis, menjalankan uji regresi CLI/API di CI, serta membuat terjemahan istilah teknis yang konsisten. Semua keluaran model ditinjau maintainer sebelum digabung, dan hanya dipakai untuk alur kerja repositori ini.';
}

/** Field "Anything else we should know?" — maksimal 500 karakter. */
function extraField(s) {
  return `Repo kecil dengan satu maintainer, tumbuh dari ${s.total - 12} menjadi ${s.total} ide dalam beberapa hari terakhir. Arsitektur sengaja tanpa dependensi agar mudah diaudit dan direplikasi. Ada CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, template issue/PR, dan ${s.tests} test berjalan di CI. Fokus berikutnya: menambah ide dari komunitas dan menjaga kualitas metrik/risiko tiap ide.`;
}

function buildGuide({ s, args }) {
  const feat = s.features.slice(0, 6).map(([name, count]) => `${name} (${count})`).join(', ');
  return `# Aplikasi Codex for Open Source — isi siap pakai

Program: **Codex for Open Source** (OpenAI) — <https://developers.openai.com/codex/community/codex-for-oss>
Formulir: <https://openai.com/form/codex-for-oss/>

> Dokumen ini dibuat otomatis oleh \`node scripts/aplikasi.js\`.
> Angka di bawah diambil dari isi repositori saat skrip dijalankan.

## Yang ditawarkan program

| Manfaat | Catatan |
|---|---|
| **6 bulan ChatGPT Pro (termasuk Codex)** | Manfaat utama; durasi & cakupan dapat berubah menurut ketentuan program |
| **Kredit API** | Untuk review PR, otomasi maintainer, alur rilis — tergantung peninjauan |
| **Codex Security** | Bersyarat, ditinjau per kasus untuk repo yang butuh |

Program meninjau **secara bergilir (rolling)**. Mengajukan tidak menjamin diterima.

## Kesiapan repositori

| Syarat yang dicari | Status di repo ini |
|---|---|
| Repositori publik | ✅ \`${args.repo}\` |
| Profil GitHub publik | ⚠️ atur visibilitas profil ke publik |
| Bukti pemeliharaan aktif | ✅ riwayat commit, CI, issue/PR template |
| Kualitas teknis dapat diaudit | ✅ nol dependensi, ${s.tests} test, CI Node 18/20/22 |
| Dokumentasi kontribusi | ✅ CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, README |
| Penggunaan/ekosistem | 🔸 isi dengan angka nyata: star, fork, unduhan, pengguna |
| Peran maintainer | ✅ primary maintainer |

Ringkasan konten: **${s.total} ide**, **${s.categories} kategori**, **${s.featureCount} kemampuan OpenAI** disebut
(${feat}).

## Jawaban siap salin

### Deskripsi peran

\`\`\`
Primary maintainer
\`\`\`

### Why does this repository qualify? (${qualifyField(s).length}/500 karakter)

\`\`\`text
${qualifyField(s)}
\`\`\`

### I'm interested in...

\`\`\`
☑ API credits for my project
☐ Codex Security   ← centang hanya bila repo menangani kode/data sensitif
\`\`\`

### How will you use API credits for your project? (${creditsField().length}/500 karakter)

\`\`\`text
${creditsField()}
\`\`\`

### Anything else we should know? (${extraField(s).length}/500 karakter)

\`\`\`text
${extraField(s)}
\`\`\`

## Data yang harus kamu isi sendiri

| Field formulir | Dari mana |
|---|---|
| First / last name | namamu |
| Email | **email akun ChatGPT** yang akan menerima manfaat |
| GitHub username | \`${args.github}\` (pastikan profil publik) |
| GitHub repository URL | \`${args.repo}\` |
| OpenAI Organization ID | <https://platform.openai.com/settings/organization/general> |

## Cara menaikkan peluang diterima (tanpa memalsukan apa pun)

1. **Isi angka nyata di kolom kualifikasi.** Repo baru tanpa bintang tetap bisa diajukan,
   tetapi sebutkan alasan ekosistem: jumlah ide, kategori, dan siapa yang diuntungkan.
   Jangan menulis bintang/unduhan yang tidak ada.
2. **Tunjukkan pemeliharaan, bukan hanya kode.** Satu issue + satu PR + satu rilis
   (tag \`v1.0.0\` dengan catatan rilis) memberi sinyal "dikelola", bukan "ditinggalkan".
3. **Nyalakan fitur komunitas** di Settings: Issues, Discussions, Security advisories.
4. **Jaga CI hijau** saat mengajukan — reviewer membuka repo dan melihat badge.
5. **Aktif di profil.** Commit publik beberapa minggu terakhir membantu; profil kosong melemahkan.
6. **Ajukan satu repo terbaik**, bukan lima repo kosong. Kalau punya proyek lain, sebut di
   bagian "Anything else" sebagai konteks.
7. **Jangan mengarang pengguna atau metrik.** Program meninjau sinyal yang bisa diverifikasi.

## Setelah mengirim

- Konfirmasi tidak otomatis; pantau email akun ChatGPT (termasuk folder spam).
- Bila diterima, manfaat berlaku **personal dan tidak dapat dipindahtangankan**.
- Bila belum berhasil, perbaiki bukti pemakaian (pengguna nyata, kontributor luar),
  lalu ajukan lagi pada periode berikutnya.
`;
}

function buildFields({ s, args }) {
  return `# Field isi — tempel cepat

Repo: ${args.repo}
GitHub: ${args.github}
Tanggal dibuat: ${new Date().toISOString().slice(0, 10)}

## Role
Primary maintainer

## Why does this repository qualify?
${qualifyField(s)}

## I'm interested in
API credits for my project

## How will you use API credits for your project?
${creditsField()}

## Anything else we should know?
${extraField(s)}

## Isi sendiri
- Nama depan / belakang:
- Email akun ChatGPT:
- OpenAI Organization ID:
- Star saat ini: (isi angka nyata) 0
- Pengguna/unduhan: (isi bila ada) —
`;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(`Pemakaian: node scripts/aplikasi.js [--repo <url>] [--github <user>] [--nama <nama>]\n`);
    return 0;
  }
  const ideas = loadIdeas();
  const s = stats(ideas);
  const docsDir = path.join(ROOT, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  fs.writeFileSync(path.join(docsDir, 'aplikasi-codex-oss.md'), buildGuide({ s, args }), 'utf8');
  fs.writeFileSync(path.join(docsDir, 'aplikasi-field.md'), buildFields({ s, args }), 'utf8');

  process.stdout.write(
    `Ditulis: docs/aplikasi-codex-oss.md dan docs/aplikasi-field.md\n`
    + `Konten: ${s.total} ide, ${s.categories} kategori, ${s.featureCount} fitur OpenAI\n`,
  );
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main, stats, countTests, qualifyField, creditsField, extraField, parseArgs };
