'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evidenceFor, addEvidence, MARKER, FALLBACK_EVIDENCE, EVIDENCE_RULES } = require('../scripts/perkaya');
const { loadIdeas } = require('../lib/ideas');

test('bukti dipilih dari aturan paling spesifik', () => {
  assert.match(evidenceFor('Biaya < $0.002 per foto'), /logger token/);
  assert.match(evidenceFor('p95 latensi < 3 s'), /latensi/);
  assert.match(evidenceFor('Akurasi total nominal ≥ 97%'), /label emas/);
  assert.match(evidenceFor('Tidak ada perubahan kode produksi'), /lint/);
  assert.match(evidenceFor('Waktu input per struk < 20 detik'), /awal-sampai-selesai/);
  assert.equal(evidenceFor('Sesuatu yang belum pernah terlihat'), FALLBACK_EVIDENCE);
  for (const [evidence, pattern] of EVIDENCE_RULES) {
    assert.ok(pattern instanceof RegExp, `pola bukan RegExp: ${evidence}`);
  }
});

test('addEvidence idempoten dan tidak menumpuk penanda', () => {
  const idea = { metrics: ['p95 latensi < 3 s', 'Biaya < $0.01'] };
  assert.equal(addEvidence(idea), true);
  const once = idea.metrics.slice();
  assert.ok(once.every((m) => m.includes(MARKER)));
  assert.equal(addEvidence(idea), false, 'jalan kedua tidak boleh mengubah apa pun');
  assert.deepEqual(idea.metrics, once);
  assert.equal(once[0].split(MARKER).length, 2, 'penanda tidak boleh dobel');
});

test('seluruh katalog sudah punya bukti verifikasi metrik', () => {
  for (const idea of loadIdeas()) {
    for (const metric of idea.metrics) {
      assert.ok(metric.includes(MARKER), `${idea.id}: metrik tanpa bukti -> ${metric}`);
      const base = metric.split(MARKER)[0];
      assert.ok(
        /[0-9]/.test(base) || /(tidak ada|tanpa|nol)/i.test(base),
        `${idea.id}: metrik tanpa angka atau syarat mutlak -> ${metric}`,
      );
      const evidence = metric.split(MARKER)[1];
      assert.ok(evidence.length > 5, `${idea.id}: bukti terlalu pendek`);
    }
  }
});

test('tidak ada metrik yang bergantung pada bukti cadangan', () => {
  const sisa = loadIdeas().flatMap((idea) => idea.metrics
    .filter((m) => m.split(MARKER)[1] === FALLBACK_EVIDENCE)
    .map((m) => `${idea.id}: ${m}`));
  assert.deepEqual(sisa, [], 'semua metrik harus punya bukti spesifik');
});
