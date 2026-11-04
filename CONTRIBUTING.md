# Berkontribusi ke Ide Codex

Terima kasih sudah mampir. Proyek ini kecil dan sengaja dijaga sederhana:
**nol dependensi runtime**, semua konten ada di `data/ideas/`, semua logika di `lib/ideas.js`.

Ada tiga cara berkontribusi, semuanya berharga:

1. **Menambah atau memperbaiki ide** di `data/ideas/*.json`.
2. **Memperbaiki kode/UI/CLI/API**.
3. **Melaporkan hal yang membingungkan** — dokumentasi yang tidak jelas adalah bug.

---

## Mulai cepat

```bash
git clone https://github.com/Sanzduw2026/CODEX.git
cd CODEX
npm test      # 22 test, tanpa install apa pun (Node.js >= 18)
npm start     # http://localhost:4173
```

Tidak perlu `npm install`: proyek ini tidak punya dependensi.

---

## Menambah ide baru (kontribusi paling dicari)

1. Buka berkas kategori yang sesuai di `data/ideas/` — misalnya ide RAG masuk ke
   `rag-knowledge.json`. Kalau kategorinya benar-benar baru, buat berkas baru
   bernama `kategori-baru.json` (satu berkas = satu kategori).
2. Salin ide yang sudah ada sebagai kerangka. Semua field wajib:

   ```json
   {
     "id": "slug-huruf-kecil",
     "title": "Nama ide",
     "tagline": "Satu kalimat, maksimal ~70 karakter.",
     "category": "RAG & Knowledge",
     "difficulty": "Menengah",
     "timeframe": "2–3 minggu",
     "summary": "Apa yang dibangun dan untuk siapa (2–4 kalimat).",
     "why": "Kenapa ide ini layak waktu pembuatnya.",
     "stack": ["Python", "FastAPI"],
     "openaiFeatures": ["Structured Outputs", "Responses API"],
     "mvp": ["Langkah 1", "Langkah 2", "Langkah 3"],
     "stretch": ["Yang ditunda setelah MVP jalan"],
     "metrics": ["Target yang bisa diukur, mis. p95 latensi < 3 s"],
     "risks": ["Risiko spesifik, bukan 'bisa gagal'"],
     "prompt": "Prompt awal untuk mulai dengan Codex."
   }
   ```

3. `npm test` — validasi otomatis akan menolak field yang hilang, `id` duplikat,
   `id` bukan slug, kategori campur dalam satu berkas, dan `difficulty` yang tidak
   dikenal (`Pemula`, `Pemula–Menengah`, `Menengah`, `Lanjutan`).
4. Buka PR dengan judul `feat(idea): <nama ide>`.

### Standar penulisan yang kami pakai

| Aturan | Alasan |
|---|---|
| Satu ide = satu alur pengguna utama | Ide yang mencakup lima fitur tidak bisa dieksekusi |
| `metrics` berisi angka, persentase, atau batas biaya | "Selesai" harus bisa diukur |
| `risks` spesifik dan bisa diuji | Membantu pembaca memutuskan, bukan menakut-nakuti |
| `mvp` maksimal 5 butir, berurutan | Paksa memilih, bukan menumpuk |
| `openaiFeatures` menyebut kemampuan yang benar-benar dipakai | Jangan menempel semua fitur |
| `prompt` cukup detail untuk dijalankan | Prompt satu kata tidak berguna |
| Bahasa Indonesia, istilah teknis tetap dalam bentuk aslinya | Konsisten dengan isi repo |

Contoh PR ide yang baik: menambah satu ide lengkap, memperbarui hitungan kategori
bila perlu, dan menyertakan alasan singkat di body PR ("gap yang diisi").

---

## Berkontribusi kode

```bash
git switch -c feat/nama-singkat
# ubah kode...
npm test                     # wajib hijau
node --check public/app.js   # sintaks UI
npm run brief                # pastikan ekspor markdown masih jalan
```

Yang dijaga saat review:

- **Nol dependensi.** Jangan tambahkan paket npm; gunakan modul bawaan Node.
- **Konten tetap di `data/`, logika tetap di `lib/`.** Jangan menaruh teks ide di kode.
- **Escape sebelum `innerHTML`.** Gunakan `escapeHtml()` di `public/app.js`.
- **Endpoint baru harus read-only** dan punya test di `tests/server.test.js`.
- **Kode berbahasa Indonesia** untuk komentar dan pesan ke pengguna.

### Struktur yang perlu kamu tahu

```
data/ideas/*.json     satu berkas per kategori, sumber tunggal konten
lib/ideas.js          validasi, filter, shuffle, ekspor md/csv
cli.js                antarmuka terminal
server.js             server HTTP tanpa dependensi
public/               UI (HTML + CSS + JS polos)
tests/                node:test
```

---

## Melaporkan bug atau usul

Gunakan template yang tersedia saat membuka issue:

- **Laporan bug** — sertakan langkah reproduksi, hasil yang diharapkan, versi Node.js.
- **Usul ide** — jelaskan masalah yang dipecahkan, bukan hanya nama teknologi.
- **Ide yang sudah ada tapi kurang tajam** — sebutkan field mana dan usulkan perbaikannya.

---

## Proses review

- Kami meninjau PR secara bergilir; target respons pertama **7 hari**.
- PR kecil lebih cepat selesai. Satu PR = satu tujuan.
- Kalau PR-mu belum ditanggapi, silakan tinggalkan komentar sopan di PR tersebut.
- Semua kontributor mengikuti [Kode Etik](CODE_OF_CONDUCT.md).
- Untuk masalah keamanan, ikuti [SECURITY.md](SECURITY.md) — jangan buka issue publik.

## Lisensi kontribusi

Dengan mengirim PR, kamu setuju kontribusimu dilisensikan di bawah MIT,
sama seperti lisensi proyek ini.
