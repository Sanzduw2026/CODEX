# Aplikasi Codex for Open Source — isi siap pakai

Program: **Codex for Open Source** (OpenAI) — <https://developers.openai.com/codex/community/codex-for-oss>
Formulir: <https://openai.com/form/codex-for-oss/>

> Dokumen ini dibuat otomatis oleh `node scripts/aplikasi.js`.
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
| Repositori publik | ✅ `https://github.com/Sanzduw2026/CODEX` |
| Profil GitHub publik | ⚠️ atur visibilitas profil ke publik |
| Bukti pemeliharaan aktif | ✅ riwayat commit, CI, issue/PR template |
| Kualitas teknis dapat diaudit | ✅ nol dependensi, 46 test, CI Node 18/20/22 |
| Dokumentasi kontribusi | ✅ CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, README |
| Penggunaan/ekosistem | 🔸 isi dengan angka nyata: star, fork, unduhan, pengguna |
| Peran maintainer | ✅ primary maintainer |

Ringkasan konten: **26 ide**, **11 kategori**, **18 kemampuan OpenAI** disebut
(Structured Outputs (24), Responses API (11), Prompt caching (10), Batch API (9), Embeddings (9), Function calling (7)).

## Jawaban siap salin

### Deskripsi peran

```
Primary maintainer
```

### Why does this repository qualify? (379/500 karakter)

```text
Ide Codex (26 ide proyek OpenAI/Codex, 11 kategori) adalah generator ide yang bisa diputar acak lewat CLI dan API HTTP, lalu diekspor jadi brief Markdown/JSON/CSV. Nol dependensi npm, 46 test otomatis, CI di Node 18/20/22, dokumentasi kontribusi lengkap. Ditujukan untuk developer yang ingin mulai proyek OpenAI tanpa menghabiskan waktu memilih. Semua konten berbahasa Indonesia.
```

### I'm interested in...

```
☑ API credits for my project
☐ Codex Security   ← centang hanya bila repo menangani kode/data sensitif
```

### How will you use API credits for your project? (386/500 karakter)

```text
Kredit API untuk otomasi pemeliharaan: memvalidasi ide baru lewat Codex sebelum masuk katalog (skema JSON + konsistensi metrik), meninjau PR kontributor, menghasilkan catatan rilis, menjalankan uji regresi CLI/API di CI, serta membuat terjemahan istilah teknis yang konsisten. Semua keluaran model ditinjau maintainer sebelum digabung, dan hanya dipakai untuk alur kerja repositori ini.
```

### Anything else we should know? (349/500 karakter)

```text
Repo kecil dengan satu maintainer, tumbuh dari 14 menjadi 26 ide dalam beberapa hari terakhir. Arsitektur sengaja tanpa dependensi agar mudah diaudit dan direplikasi. Ada CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, template issue/PR, dan 46 test berjalan di CI. Fokus berikutnya: menambah ide dari komunitas dan menjaga kualitas metrik/risiko tiap ide.
```

## Data yang harus kamu isi sendiri

| Field formulir | Dari mana |
|---|---|
| First / last name | namamu |
| Email | **email akun ChatGPT** yang akan menerima manfaat |
| GitHub username | `Sanzduw2026` (pastikan profil publik) |
| GitHub repository URL | `https://github.com/Sanzduw2026/CODEX` |
| OpenAI Organization ID | <https://platform.openai.com/settings/organization/general> |

## Cara menaikkan peluang diterima (tanpa memalsukan apa pun)

1. **Isi angka nyata di kolom kualifikasi.** Repo baru tanpa bintang tetap bisa diajukan,
   tetapi sebutkan alasan ekosistem: jumlah ide, kategori, dan siapa yang diuntungkan.
   Jangan menulis bintang/unduhan yang tidak ada.
2. **Tunjukkan pemeliharaan, bukan hanya kode.** Satu issue + satu PR + satu rilis
   (tag `v1.0.0` dengan catatan rilis) memberi sinyal "dikelola", bukan "ditinggalkan".
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
