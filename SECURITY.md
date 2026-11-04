# Kebijakan Keamanan

## Versi yang didukung

Proyek ini dirilis sebagai perangkat lunak sumber terbuka tanpa jadwal rilis
bernomor. Perbaikan keamanan selalu masuk ke branch `main`.

## Melaporkan kerentanan

Jangan membuka issue publik untuk kerentanan. Gunakan salah satu jalur berikut:

1. **GitHub Security Advisories** — tab *Security* → *Report a vulnerability*
   (disarankan, karena bisa berdiskusi secara privat).
2. Email maintainer yang tercantum di profil GitHub, dengan subjek
   `[SECURITY] Ide Codex`.

Sertakan: deskripsi, langkah reproduksi, dampak yang mungkin, dan versi Node.js.

Kami berusaha merespons dalam **7 hari** dan memberi kabar tentang rencana
perbaikan. Kami akan mencantumkan nama pelapor di catatan rilis bila diinginkan.

## Model ancaman yang relevan

| Area | Perhatian |
|---|---|
| Server statis (`server.js`) | Path traversal — sudah ditangani dengan resolusi path absolut + pengecekan prefiks, dan diuji di `tests/server.test.js` |
| API baca-saja | Tidak ada penulisan, tidak ada autentikasi, tidak ada data pengguna |
| Data ide | Statis, tidak dieksekusi; dimuat lewat `JSON.parse` dengan validasi skema |
| XSS di UI | Semua konten dari `data/` di-escape sebelum masuk `innerHTML` |
| Dependensi | Nol dependensi runtime — permukaan serangan sangat kecil |

Bila kamu men-deploy ini di internet terbuka: jalankan di balik reverse proxy,
batasi ukuran request, dan jangan menambahkan endpoint tulis tanpa autentikasi.

## Yang bukan cakupan

- Konten ide (target, metrik, estimasi) bukan jaminan hasil — lihat `README.md`.
- Prompt contoh di `data/` adalah materi edukasi, bukan nasihat profesional.
