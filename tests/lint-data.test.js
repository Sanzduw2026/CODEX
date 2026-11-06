'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  lintIdea, lintCatalog, summarize, formatReport,
  MIN_RISK_LENGTH, MIN_SUMMARY_LENGTH, MIN_STRETCH,
} = require('../lib/lint');
const { loadIdeas } = require('../lib/ideas');

const contohIdea = {
  id: 'contoh-ide',
  title: 'Contoh Ide',
  tagline: 'Satu kalimat.',
  category: 'Contoh',
  difficulty: 'Menengah',
  timeframe: '2 minggu',
  summary: 'Ringkasan yang cukup panjang untuk lolos pemeriksaan minimal dari lint katalog ini ya.',
  why: 'Alasan.',
  stack: ['Node.js', 'SQLite'],
  openaiFeatures: ['Structured Outputs'],
  mvp: ['Satu', 'Dua', 'Tiga'],
  stretch: ['Lanjut satu', 'Lanjut dua'],
  metrics: ['p95 latensi < 3 s → bukti: log latensi di suite uji beban'],
  risks: ['Kegagalan jaringan membuat antrean menumpuk tanpa retry'],
  prompt: 'Prompt yang cukup panjang agar tidak dianggap terlalu tipis oleh pemeriksaan lint katalog.',
};

const ambil = (findings, rule) => findings.filter((f) => f.rule === rule);

test('ide yang sehat tidak menghasilkan temuan', () => {
  assert.deepEqual(lintIdea(contohIdea), []);
});

test('risiko pendek dan terlalu umum ditandai sebagai error', () => {
  const pendek = lintIdea({ ...contohIdea, risks: ['Banjir PR'] });
  assert.equal(ambil(pendek, 'risiko-umum')[0].level, 'error');
  assert.match(ambil(pendek, 'risiko-umum')[0].message, new RegExp(`${MIN_RISK_LENGTH}`));

  const umum = lintIdea({ ...contohIdea, risks: ['bisa gagal'] });
  assert.equal(ambil(umum, 'risiko-umum').length, 1);

  const kapital = lintIdea({ ...contohIdea, risks: ['KEGAGALAN SERVER TOTAL TANPA BACKUP'] });
  assert.equal(ambil(kapital, 'risiko-kapital')[0].level, 'warn');
});

test('metrik tanpa angka ditolak, syarat mutlak diterima', () => {
  const tanpaAngka = lintIdea({ ...contohIdea, metrics: ['Semua komponen punya test render → bukti: laporan test & mutation di CI'] });
  assert.equal(ambil(tanpaAngka, 'metrik-tanpa-angka').length, 1);

  const mutlak = lintIdea({ ...contohIdea, metrics: ['Tidak ada perubahan kode produksi → bukti: cek otomatis di setiap PR (lint/aturan repo)'] });
  assert.equal(ambil(mutlak, 'metrik-tanpa-angka').length, 0);
});

test('ringkasan/prompt tipis dan MVP kurang ditandai error', () => {
  const tipis = lintIdea({ ...contohIdea, summary: 'Pendek.', prompt: 'Pendek.', mvp: ['satu'] });
  assert.equal(ambil(tipis, 'ringkasan-tipis').length, 1);
  assert.equal(ambil(tipis, 'prompt-tipis').length, 1);
  assert.equal(ambil(tipis, 'mvp-kurang').length, 1);
  assert.ok(MIN_SUMMARY_LENGTH > 0);
});

test('stretch kurang hanya peringatan', () => {
  const findings = lintIdea({ ...contohIdea, stretch: ['satu'] });
  assert.equal(ambil(findings, 'stretch-kurang')[0].level, 'warn');
  assert.ok(MIN_STRETCH >= 2);
});

test('duplikasi stack/fitur dan judul kembar terdeteksi', () => {
  const dup = lintIdea({ ...contohIdea, stack: ['Node.js', 'node.js '] });
  assert.equal(ambil(dup, 'stack-duplikat').length, 1);

  const katalog = lintCatalog([
    contohIdea,
    { ...contohIdea, id: 'contoh-lain', title: 'contoh ide' },
  ]);
  const judul = katalog.flatMap((entry) => entry.findings).filter((f) => f.rule === 'judul-duplikat');
  assert.equal(judul.length, 1);
  assert.equal(judul[0].level, 'error');
});

test('kategori berisi satu ide dilaporkan sebagai sinyal', () => {
  const katalog = lintCatalog([contohIdea]);
  const kategori = katalog.flatMap((e) => e.findings).filter((f) => f.rule === 'kategori-tunggal');
  assert.equal(kategori.length, 1);
  assert.equal(kategori[0].level, 'warn');
});

test('ringkasan dan format laporan konsisten', () => {
  const results = lintCatalog([{ ...contohIdea, risks: ['pendek'] }, contohIdea]);
  const { errors, warns } = summarize(results);
  assert.ok(errors >= 1);
  assert.ok(warns >= 0);
  const teks = formatReport(results);
  assert.match(teks, /ERROR/);
  assert.match(teks, /error, .* peringatan/);
  assert.match(formatReport([]), /tidak ada temuan/);
});

test('katalog nyata bersih dari error', () => {
  const hasil = lintCatalog(loadIdeas());
  const errors = hasil.flatMap((e) => e.findings).filter((f) => f.level === 'error');
  assert.deepEqual(errors, [], `masih ada error lint: ${JSON.stringify(errors, null, 2)}`);
});

test('CLI lint keluar 0 pada katalog sekarang dan 2 untuk argumen salah', () => {
  const script = path.join(__dirname, '..', 'scripts', 'lint-data.js');
  const out = execFileSync(process.execPath, [script, '--json'], { encoding: 'utf8' });
  const data = JSON.parse(out);
  assert.equal(data.ringkasan.errors, 0);
  assert.equal(data.total, loadIdeas().length);

  assert.throws(
    () => execFileSync(process.execPath, [script, '--ngawur'], { encoding: 'utf8', stdio: 'pipe' }),
    (err) => err.status === 2,
  );
});
