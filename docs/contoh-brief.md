# Brief Proyek OpenAI / Codex

Dibuat: 2026-11-04T03:50:40.861Z
Jumlah ide: 3

---

# Monitor Biaya & Latensi LLM (llm-cost-latency-monitor)

> Tagihan bulanan tidak boleh jadi kejutan.

**Kategori:** Evaluasi & Observability  
**Tingkat:** Pemula–Menengah  
**Estimasi:** 2 minggu

## Ringkasan

Proxy ringan di depan API model yang mencatat token, biaya, latensi per fitur/pengguna, mendeteksi pemakaian anomali, dan menegakkan anggaran per tim sebelum tagihan membengkak.

## Kenapa layak dikerjakan

Masalah pertama aplikasi AI setelah diluncurkan biasanya biaya, bukan kualitas. Alat ini kecil tapi langsung dipakai.

## Stack

- Node.js
- ClickHouse
- Grafana
- Docker

## Kemampuan OpenAI yang dipakai

- Responses API
- Prompt caching
- Batch API
- Token counting

## Cakupan MVP

1. Proxy transparan + atribusi biaya per fitur/pengguna
2. Anggaran harian/bulanan dengan hard stop dan alert
3. Deteksi anomali biaya (z-score sederhana)
4. Dashboard p50/p95 latensi dan rasio cache hit

## Pengembangan lanjutan

- Saran rute model lebih murah berdasarkan data nyata
- Simulasi tagihan sebelum rilis fitur
- Ekspor laporan ke Slack mingguan

## Target terukur

- [ ] Overhead < 25 ms p95
- [ ] Selisih hitungan biaya < 3%
- [ ] Anggaran terlampaui tertahan 100%

## Risiko & cara meredamnya

- Token estimation tidak akurat
- Proxy menjadi single point of failure

## Prompt awal (system)

```text
Dari log permintaan ini, hitung perkiraan biaya berdasarkan tabel harga yang diberikan. Kembalikan JSON {inputTokens, cachedTokens, outputTokens, costUsd, notes}. Jika model tidak ada di tabel, kembalikan costUsd=null.
```

---

# Pembuat Kuis Kurikulum Sekolah (school-quiz-generator)

> Soal bertingkat dari materi guru, lengkap dengan kunci dan pembahasan.

**Kategori:** Edukasi  
**Tingkat:** Pemula–Menengah  
**Estimasi:** 2 minggu

## Ringkasan

Guru mengunggah materi (PDF/slide), sistem menghasilkan paket soal dengan tingkat kesulitan berlapis, kunci jawaban, pembahasan, dan varian A/B untuk mencegah contekan — dengan biaya per paket yang sangat kecil.

## Kenapa layak dikerjakan

Pengguna jelas (guru), waktu yang dihemat nyata, dan cocok untuk menunjukkan Batch API + caching untuk menekan biaya di skala sekolah.

## Stack

- Python
- FastAPI
- PostgreSQL
- React

## Kemampuan OpenAI yang dipakai

- Batch API
- Structured Outputs
- Prompt caching
- Embeddings

## Cakupan MVP

1. Impor materi dan ekstraksi konsep kunci
2. Generate paket soal: mudah/sedang/sulit + pembahasan
3. Validasi otomatis: tidak ada soal duplikat, kunci konsisten
4. Ekspor DOCX/PDF siap cetak

## Pengembangan lanjutan

- Varian soal per siswa dari bank yang sama
- Analitik butir soal (tingkat kesulitan nyata)
- Umpan balik otomatis untuk jawaban esai

## Target terukur

- [ ] Biaya < $0.02 per paket 20 soal
- [ ] ≥ 95% soal lolos validasi otomatis
- [ ] Guru hanya mengedit < 20% soal

## Risiko & cara meredamnya

- Soal ambigu atau kunci salah
- Materi berhak cipta

## Prompt awal (system)

```text
Buat soal pilihan ganda untuk konsep berikut pada level yang diminta. Setiap soal: pertanyaan, 4 opsi, kunci, pembahasan 2 kalimat, dan konsep yang diuji. Hindari jebakan yang menguji bacaan, bukan pemahaman.
```

---

# Tanya Dokumen, Dapat Kutipan (doc-qa-citations)

> RAG yang menolak menjawab kalau tidak ada bukti.

**Kategori:** RAG & Knowledge  
**Tingkat:** Pemula–Menengah  
**Estimasi:** 2 minggu

## Ringkasan

Sistem tanya-jawab di atas kumpulan dokumen internal (PDF, Markdown, Notion export) yang selalu menampilkan kutipan halaman/paragraf, dan menjawab 'tidak tahu' ketika bukti tidak cukup.

## Kenapa layak dikerjakan

Proyek RAG klasik, tetapi fokus pada bagian yang paling sering diabaikan: sitasi yang benar dan penolakan yang jujur.

## Stack

- Python
- FastAPI
- pgvector
- Next.js

## Kemampuan OpenAI yang dipakai

- Embeddings
- Responses API
- Structured Outputs
- File Search

## Cakupan MVP

1. Ingest + chunking sadar-struktur (heading, tabel)
2. Hybrid search (BM25 + vektor) dengan rerank
3. Jawaban wajib JSON: {answer, citations[], confidence}
4. Halaman evaluasi: ukur faithfulness & citation accuracy

## Pengembangan lanjutan

- Multi-dokumen dengan ACL per pengguna
- Highlight kutipan langsung di PDF viewer
- Cache semantik untuk pertanyaan berulang

## Target terukur

- [ ] Citation accuracy ≥ 95%
- [ ] Penolakan tepat pada 20 pertanyaan jebakan
- [ ] p95 latensi < 3 s

## Risiko & cara meredamnya

- Chunk memotong konteks penting
- Dokumen usang

## Prompt awal (system)

```text
Jawab HANYA dari konteks yang diberikan. Sertakan id kutipan untuk setiap klaim. Jika konteks tidak memadai, kembalikan answer=null dan alasan singkat. Jangan menebak.
```

---
