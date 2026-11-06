# Peta jalan

Dokumen ini publik supaya siapa pun bisa melihat arah proyek dan memilih bagian
yang ingin dibantu. Tidak ada tanggal yang dijanjikan; urutan bisa berubah.
Semua butir di bawah adalah pekerjaan nyata yang belum selesai — bukan daftar keinginan.

Legenda: `[ ]` belum dimulai · `[~]` sedang dikerjakan · `[x]` selesai

## Sekarang — v1.0 (fondasi)

- [x] 26 ide terkurasi dalam 11 kategori
- [x] Validasi skema otomatis + 27 test
- [x] CLI, API baca-saja, UI tanpa dependensi
- [x] CI di Node 18/20/22
- [x] Dokumentasi kontribusi, kode etik, kebijakan keamanan
- [ ] Label issue + milestone pertama
- [ ] Tangkapan layar UI di README

## Berikutnya — kualitas katalog

- [ ] **Skor kelayakan ide** — setiap ide dinilai pada 4 sumbu: kejelasan masalah,
      ketajaman metrik, keterujian, dan risiko; skor dihitung dari aturan sederhana
      (bukan model) agar bisa diaudit.
- [x] **Lint isi** — `scripts/lint-data.js`: metrik tanpa angka, risiko terlalu
      umum, ringkasan/prompt tipis, duplikasi stack/fitur, judul kembar.
- [ ] **Jejak fitur** — peringatkan `openaiFeatures` yang tidak muncul di MVP/ringkasan.
- [ ] **Target 50 ide** dengan minimal 3 ide per kategori.
- [ ] Rujukan silang antar ide ("mirip dengan", "prasyarat untuk").
- [ ] Riwayat perubahan katalog (`CHANGELOG.md` per rilis).

## Berikutnya — kegunaan

- [ ] **Mode rencana** — `node cli.js --id <slug> --plan` menghasilkan urutan
      tugas harian dari `mvp`, dengan estimasi jam per langkah.
- [ ] **Ekspor ke GitHub Issues** — buat issue dari brief dengan `--format gh`
      (dry-run secara bawaan).
- [ ] **Tema gelap** untuk UI yang mengikuti `prefers-color-scheme`.
- [ ] Ekspor PDF via cetak dari halaman brief (tanpa dependensi).
- [ ] Pencarian dengan fuzzy match dan penyorotan kata kunci.

## Nanti — komunitas

- [ ] Template "saya sudah membangun ini" di Discussions.
- [ ] Galeri proyek hasil ide (tautan ke repo orang lain, dengan izin).
- [ ] Terjemahan README ke bahasa Inggris.
- [ ] Halaman statistik sederhana: ide per kategori, fitur OpenAI paling sering dipakai.

## Bagaimana saya memilih apa yang dikerjakan

1. Kontribusi komunitas yang sudah siap (PR) mendahului rencana baru.
2. Pekerjaan yang membuat isi katalog lebih bisa dipercaya (validasi, lint, skor)
   mendahului penambahan fitur baru.
3. Fitur yang menambah dependensi akan ditolak kecuali ada alasan kuat; proyek ini
   sengaja tanpa dependensi.

Ingin mengerjakan salah satu butir? Buka issue dengan judul `roadmap: <butir>` agar
kita sepakati ruang lingkupnya sebelum kode ditulis.
