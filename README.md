# Ide Codex — generator ide proyek OpenAI acak

Repo ini bukan kumpulan tautan. Isinya **mesin ide**: 14 ide proyek OpenAI/Codex yang sudah dipikirkan
sampai level MVP, bisa diputar acak lewat UI atau CLI, difilter, lalu diekspor menjadi brief Markdown/JSON/CSV
yang siap kamu bawa ke Codex atau ke dokumen perencanaan.

Tanpa dependensi eksternal. Tanpa API key. Cukup Node.js 18+.

```
┌──────────────┐   pilih filter   ┌───────────────┐   brief .md / .json / .csv
│ data/ideas   │ ───────────────▶ │  lib/ideas.js │ ─────────────────────────▶
└──────────────┘                  └───────────────┘
                                    ▲           ▲
                             cli.js             server.js → public/ (UI)
```

## Mulai cepat

```bash
git clone <repo-ini> && cd CODEX
npm test          # 20 test, tanpa dependensi
npm start         # UI di http://localhost:4173
node cli.js       # satu ide acak di terminal
```

## Apa isi satu ide?

Setiap entri di `data/ideas.json` punya:

| Field | Isi |
|---|---|
| `title`, `tagline` | Nama dan satu kalimat penjual |
| `category`, `difficulty`, `timeframe` | Posisi ide dalam ruang masalah + estimasi realistis |
| `summary` | Apa yang dibangun, untuk siapa |
| `why` | Kenapa ide ini layak waktu kamu |
| `stack`, `openaiFeatures` | Teknologi dan kemampuan OpenAI yang benar-benar dipakai |
| `mvp` | Cakupan minimum, 3–5 langkah berurutan |
| `stretch` | Yang ditunda setelah MVP jalan |
| `metrics` | Definisi "selesai" yang bisa diukur |
| `risks` | Hal yang paling mungkin bikin proyek gagal |
| `prompt` | Prompt awal untuk mulai dengan Codex |

Kategori saat ini: Codex/Developer Tools, RAG & Knowledge, Voice & Realtime, Evaluasi & Observability,
Keamanan AI, Edukasi, Data & Analitik, Vision & Multimodal, Dokumen & Legal, Produktivitas & Agen.

## CLI

```bash
node cli.js --list                                   # semua ide + kategori + fitur OpenAI
node cli.js -n 3 --difficulty Menengah                # 3 ide acak di tingkat tertentu
node cli.js --category "RAG & Knowledge" --format md  # brief markdown ke stdout
node cli.js --tech "Realtime" -n 2                    # filter berdasarkan kemampuan OpenAI/stack
node cli.js --search "test"                           # cari di judul, ringkasan, metrik
node cli.js --seed klinik -n 2                        # hasil acak yang bisa direproduksi
node cli.js --id doc-qa-citations --format md -o brief.md
node cli.js -n 5 --format json                        # untuk diproses skrip lain
```

| Opsi | Keterangan |
|---|---|
| `-n, --count <n>` | Jumlah ide (default 1) |
| `--category`, `--difficulty`, `--tech`, `--search` | Filter |
| `--seed <teks>` | Seed acak deterministik |
| `--id <slug[,slug]>` | Ambil ide tertentu |
| `--format text\|json\|md\|csv` | Format keluaran |
| `-o, --out <file>` | Tulis ke file |
| `--list` | Daftar kategori, fitur, semua ide |

## API lokal

| Endpoint | Keterangan |
|---|---|
| `GET /api/meta` | Total, kategori, tingkat, hitungan fitur OpenAI |
| `GET /api/ideas` | Semua ide (`count`, `shuffle`, filter) |
| `GET /api/random?count=2&category=...` | Ide acak sesuai filter |
| `GET /api/ideas/:id` | Satu ide |
| `GET /api/export?format=md&ids=...` | Unduh brief |
| `GET /healthz` | Cek server |

Contoh:

```bash
curl "http://localhost:4173/api/random?count=2&difficulty=Lanjutan"
curl -o brief.md "http://localhost:4173/api/export?format=md&count=3"
```

## Struktur repo

```
data/ideas.json      sumber data ide (satu-satunya tempat mengedit konten)
lib/ideas.js         validasi data, filter, pemilihan acak, ekspor markdown/csv
cli.js               antarmuka terminal
server.js            server HTTP tanpa dependensi (API + static)
public/              UI: index.html, styles.css, app.js
tests/               node:test untuk data, lib, CLI, dan API
docs/contoh-brief.md contoh hasil ekspor
```

## Menambah ide baru

1. Tambahkan objek ke `data/ideas.json` (semua field wajib, `id` berupa slug huruf kecil).
2. `npm test` — validasi akan menolak field hilang, duplikat id, atau tingkat yang tidak dikenal.
3. Kategori baru otomatis muncul di UI dan CLI.

Aturan penulisan yang saya pakai: **satu ide = satu alur pengguna utama**, metrik harus bisa diukur
(angka, persentase, atau batas biaya), dan risiko harus spesifik — bukan "bisa gagal".

## Catatan

- Data bersifat statis; tidak ada panggilan ke API OpenAI saat runtime.
- `openaiFeatures` mengacu pada kemampuan yang relevan (Responses API, Structured Outputs, Realtime, dll.).
  Verifikasi ketersediaan & harga terbaru di dokumentasi resmi sebelum memutuskan arsitektur.
- Semua target dan estimasi adalah titik awal untuk perencanaan, bukan janji.
