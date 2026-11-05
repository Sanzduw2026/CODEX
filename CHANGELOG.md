# Riwayat perubahan

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan
[Semantic Versioning](https://semver.org/lang/id/).

## [Belum dirilis]

### Direncanakan

- Lint isi katalog lebih lengkap (risiko terlalu umum, `openaiFeatures` tanpa
  jejak di MVP) — lihat `docs/ROADMAP.md`.
- Tangkapan layar UI di README.

## [1.1.0] — 2026-11-04

### Ditambahkan

- `scripts/perkaya.js` — menambahkan bukti verifikasi pada setiap target terukur
  ("→ bukti: …"), idempoten, dengan mode `--check` untuk CI.
- `scripts/siap-aplikasi.js` — memeriksa kesiapan repo untuk program
  *Codex for Open Source* lewat GitHub API (publik, Issues, Discussions, rilis,
  issue terbuka, aktivitas commit, bintang, lisensi).
- 7 test baru: idempotensi penguat katalog, kelengkapan bukti metrik, dan
  logika pemeriksaan kesiapan (total 36 test).
- Badge README, `CHANGELOG.md`, dan script npm `cek`/`perkaya`/`siap`/`og`.

### Diubah

- Seluruh 78 target terukur kini menyebut **cara pembuktiannya** (label emas,
  laporan biaya, uji latensi, lint PR, dan seterusnya).
- 4 target dipertegas agar dapat diukur: test render komponen, CI hijau per PR,
  regresi versi lama/baru, dan kutipan temuan kontrak.
- CI menjalankan `perkaya --check` dan menolak PR yang meninggalkan dokumen
  aplikasi usang.

## [1.0.0] — 2026-11-04

### Ditambahkan

- Katalog **26 ide** proyek OpenAI/Codex dalam **11 kategori**, satu berkas JSON
  per kategori di `data/ideas/`.
- Skema ide lengkap: ringkasan, alasan, stack, kemampuan OpenAI, cakupan MVP,
  pengembangan lanjutan, target terukur, risiko, dan prompt awal.
- `lib/ideas.js` — validasi skema, filter, pemilihan acak deterministik, ekspor
  Markdown/JSON/CSV.
- `cli.js` — `--count`, `--category`, `--difficulty`, `--tech`, `--search`,
  `--seed`, `--id`, `--format`, `--out`, `--list`.
- `server.js` + `public/` — UI tanpa dependensi dan API baca-saja
  (`/api/meta`, `/api/ideas`, `/api/random`, `/api/ideas/:id`, `/api/export`,
  `/healthz`, `/assets/*`).
- Dokumentasi komunitas: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `docs/ROADMAP.md`, template issue dan PR.
- CI GitHub Actions: test di Node 18/20/22 + validasi data pada PR.
- `scripts/aplikasi.js` — kit aplikasi program Codex for Open Source
  (`docs/aplikasi-codex-oss.md`, `docs/aplikasi-field.md`).
- Gambar sosial `assets/og-image.svg`.

### Catatan

- Manfaat, syarat, dan hasil peninjauan program Codex for Open Source sepenuhnya
  ditentukan OpenAI; repositori ini hanya menyiapkan bahan aplikasi.
- Target dan estimasi pada setiap ide adalah titik awal perencanaan, bukan janji.
