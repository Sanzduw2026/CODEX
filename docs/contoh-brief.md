# Brief Proyek OpenAI / Codex

Dibuat: 2026-11-04T03:42:19.773Z
Jumlah ide: 3

---

# Screenshot → Aplikasi Jalan (screenshot-to-app)

> Dari gambar desain ke komponen React yang bisa dites.

**Kategori:** Codex / Developer Tools  
**Tingkat:** Menengah  
**Estimasi:** 3 minggu

## Ringkasan

Pipeline yang mengubah screenshot UI menjadi komponen React + Tailwind, lengkap dengan test visual: render ulang, bandingkan screenshot, dan iterasi sampai selisih pixel di bawah ambang.

## Kenapa layak dikerjakan

Memaksa loop agent yang benar-benar tertutup: generate → render → ukur → perbaiki. Skill yang sama dipakai untuk semua tugas coding agent.

## Stack

- TypeScript
- Playwright
- Vite
- Codex CLI

## Kemampuan OpenAI yang dipakai

- Vision input
- Codex CLI
- Structured Outputs

## Cakupan MVP

1. Ekstraksi layout & design token kasar dari gambar
2. Generate komponen + storybook/story per komponen
3. Render headless, diff screenshot, hitung skor kemiripan
4. Maksimal N iterasi perbaikan dengan riwayat diff

## Pengembangan lanjutan

- Mode responsif (mobile/desktop)
- Ekstraksi aset & ikon otomatis
- Ekspor ke shadcn/ui

## Target terukur

- [ ] Skor kemiripan ≥ 0.9 pada 10 desain uji
- [ ] Semua komponen punya test render
- [ ] < 5 iterasi rata-rata

## Risiko & cara meredamnya

- Desain ambigu/bergerak
- Font & aset tidak tersedia

## Prompt awal (system)

```text
Bandingkan dua screenshot. Daftar perbedaan visual yang terlihat (spacing, ukuran font, warna, radius, alignment) dalam JSON, urut dari yang paling mengganggu. Jangan menyarankan perbaikan CSS dulu.
```

---

# Migration Copilot (v1 → v2) (migration-copilot)

> Refactor berskala repo dengan bukti di setiap langkah.

**Kategori:** Codex / Developer Tools  
**Tingkat:** Lanjutan  
**Estimasi:** 4 minggu

## Ringkasan

Alat untuk memigrasikan pola kode lama ke API baru (mis. kelas komponen → hooks, callback → async/await) di banyak file: inventaris, rencana per file, patch kecil yang bisa diverifikasi test, dan laporan progres.

## Kenapa layak dikerjakan

Kasus terbaik untuk agentic coding: banyak file, aturan jelas, verifikasi otomatis lewat test.

## Stack

- TypeScript
- ts-morph
- Codex CLI
- GitHub Actions

## Kemampuan OpenAI yang dipakai

- Codex CLI
- Batch API
- Structured Outputs

## Cakupan MVP

1. Aturan migrasi deklaratif (pola → transformasi)
2. Deteksi otomatis file terdampak + estimasi kesulitan
3. Patch per file; jalankan test/lint sebelum & sesudah
4. Dry-run mode yang hanya menulis laporan

## Pengembangan lanjutan

- Rollback otomatis jika test merah
- Prioritas file berdasarkan traffic
- Codemod deterministik untuk pola umum

## Target terukur

- [ ] ≥ 70% file termigrasi otomatis
- [ ] CI hijau di setiap PR
- [ ] 0 perubahan di luar cakupan

## Risiko & cara meredamnya

- Perubahan semi-otomatis sulit direview
- Test coverage rendah menyembunyikan regresi

## Prompt awal (system)

```text
Terapkan aturan migrasi berikut pada file ini. Ubah seminimal mungkin. Jika tidak yakin atau butuh konteks file lain, kembalikan status='perlu_manual' beserta alasan. Jangan mengubah perilaku publik.
```

---

# Codex Repo Onboarding Copilot (codex-repo-onboarding)

> Ubah repo asing jadi peta pengetahuan dalam 5 menit.

**Kategori:** Codex / Developer Tools  
**Tingkat:** Menengah  
**Estimasi:** 2–3 minggu

## Ringkasan

CLI + web report yang membaca sebuah repositori, memetakan arsitektur, titik masuk, alur data, dan 'jebakan' (config tersembunyi, migrasi DB, env wajib), lalu menulis dokumen onboarding yang bisa dibaca manusia dan dipakai ulang oleh Codex sebagai konteks.

## Kenapa layak dikerjakan

Onboarding repo adalah tugas pertama yang paling sering diminta ke Codex. Output yang terstruktur (bukan chat) membuat hasilnya bisa direview tim dan dipakai ulang.

## Stack

- Node.js
- TypeScript
- Codex CLI
- SQLite
- Mermaid

## Kemampuan OpenAI yang dipakai

- Codex CLI
- Structured Outputs
- Embeddings
- Prompt caching

## Cakupan MVP

1. Index file kunci: manifest, entrypoint, CI, migrasi, env example
2. Ringkas tiap modul + diagram arsitektur Mermaid
3. Generate ONBOARDING.md + 'first tasks' untuk kontributor baru
4. Skor keyakinan per klaim, tandai bagian yang perlu dicek manusia

## Pengembangan lanjutan

- Watch mode: perbarui dokumen saat PR merge
- Band context per modul agar hemat token
- Reviewer mode: bandingkan dokumen vs kode terkini

## Target terukur

- [ ] Waktu onboarding < 10 menit
- [ ] ≥ 80% klaim diverifikasi benar
- [ ] Biaya analisis < $0.05 per repo

## Risiko & cara meredamnya

- Repo besar bisa melebihi konteks
- Klaim halusinasi soal perilaku runtime

## Prompt awal (system)

```text
Kamu adalah arsitek perangkat lunak. Dari daftar file dan isi modul yang saya berikan, hasilkan ringkasan arsitektur dalam JSON: entrypoints, modules, dataFlow, risks, openQuestions. Setiap klaim harus menyertakan file sebagai bukti.
```

---
