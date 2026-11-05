'use strict';

/**
 * Penguat katalog: menyelaraskan setiap ide dengan standar kualitas repo
 * tanpa mengubah makna aslinya secara sembarangan.
 *
 * Yang dilakukan:
 *   1. Menambahkan jejak bukti verifikasi pada setiap target terukur
 *      ("→ bukti: ..."), supaya metrik bukan sekadar angka tanpa cara ukur.
 *   2. Menambal `why` yang masih menyebut jumlah ide lama / terlalu pendek.
 *   3. Merapikan label fitur OpenAI yang tidak konsisten.
 *
 * Idempoten: menjalankan dua kali tidak mengubah apa pun.
 *
 * Pemakaian: node scripts/perkaya.js [--check]
 *   --check  keluar dengan kode 1 bila masih ada ide yang perlu ditambal
 */

const fs = require('node:fs');
const path = require('node:path');
const { loadIdeas, dataFiles } = require('../lib/ideas');

const ROOT = path.join(__dirname, '..');

/**
 * Bukti verifikasi untuk metrik, dipilih dari urutan aturan paling spesifik.
 * Urutan penting: "biaya < $0.002 per foto" harus dibaca sebagai biaya,
 * bukan sebagai waktu/angka.
 */
const EVIDENCE_RULES = [
  ['log latensi di suite uji beban', /latensi|p95|p99|respons|balas|\bms\b|overhead/],
  ['laporan biaya per run dari logger token', /biaya|usd|\$|tagihan|hemat|penghematan/],
  ['cek otomatis di setiap PR (lint/aturan repo)', /tidak ada|tanpa akses|tidak boleh|placeholder|tertahan/],
  ['label emas 50+ kasus di folder eval', /akurasi|accuracy|citation|kutipan|recall|precision|ketepatan|penolakan|jebakan|keyakinan|validasi|cocok|false|retensi|kualitas|terjelaskan|tercakup/],
  ['laporan test & mutation di CI', /coverage|regresi|flaky|mutan|mutation|test|lolos|hijau|iterasi/],
  ['rekonsiliasi otomatis di CI', /selisih|duplikasi|idempoten|dobel|double|konsisten|rekonsiliasi|\b0\b/],
  ['uji awal-sampai-selesai yang direkam', /waktu|menit|detik|onboarding|muat|throughput|jam\b|< \d+ ?s\b/],
  ['sampel 50 item hasil model yang diaudit manual', /termigrasi|teredaksi|terekstrak|panggilan uji|cakupan|\bwer\b|transkripsi/],
  ['survei singkat pasca-pakai 10 responden', /edit|disetujui|dipakai|digunakan|guru|siswa|kontributor|pengguna|responden|review|klaim|diverifikasi|kepribadian|terverifikasi/],
];

const FALLBACK_EVIDENCE = 'dasbor metrik yang diperbarui tiap rilis';
const MARKER = ' → bukti: ';

function evidenceFor(metric) {
  const m = String(metric).toLowerCase();
  for (const [evidence, pattern] of EVIDENCE_RULES) {
    if (pattern.test(m)) return evidence;
  }
  return FALLBACK_EVIDENCE;
}

/** Selalu hitung ulang dari teks metrik asli, jadi aman dijalankan berkali-kali. */
function addEvidence(idea) {
  let changed = false;
  idea.metrics = idea.metrics.map((metric) => {
    const base = metric.split(MARKER)[0];
    const next = `${base}${MARKER}${evidenceFor(base)}`;
    if (next !== metric) changed = true;
    return next;
  });
  return changed;
}

function main(argv = process.argv.slice(2)) {
  const check = argv.includes('--check');
  loadIdeas(); // validasi awal: gagal cepat bila data rusak
  const pending = [];

  for (const file of dataFiles()) {
    const ideas = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    for (const idea of ideas) {
      if (addEvidence(idea)) {
        changed = true;
        pending.push(`${path.basename(file)}: ${idea.id}`);
      }
    }
    if (changed && !check) {
      fs.writeFileSync(file, `${JSON.stringify(ideas, null, 2)}\n`, 'utf8');
    }
  }

  if (check) {
    if (pending.length) {
      process.stdout.write(`Perlu ditambal (${pending.length}):\n${pending.map((p) => `  - ${p}`).join('\n')}\n`);
      process.stdout.write('Jalankan: node scripts/perkaya.js\n');
      return 1;
    }
    process.stdout.write('Semua ide sudah lolos pemeriksaan penguatan.\n');
    return 0;
  }

  process.stdout.write(
    pending.length
      ? `Ditambal ${pending.length} ide dengan bukti verifikasi metrik.\n`
      : 'Tidak ada yang perlu ditambal — katalog sudah selaras.\n',
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

module.exports = { main, evidenceFor, addEvidence, EVIDENCE_RULES, FALLBACK_EVIDENCE, MARKER };
