'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadIdeas } = require('../lib/ideas');
const { stats, countTests, qualifyField, creditsField, extraField, parseArgs } = require('../scripts/aplikasi');

const ideas = loadIdeas();
const s = stats(ideas);

test('angka statistik konsisten dengan data', () => {
  assert.equal(s.total, ideas.length);
  assert.equal(s.categories, new Set(ideas.map((i) => i.category)).size);
  assert.ok(s.tests >= 20, `test terhitung: ${s.tests}`);
  assert.equal(countTests(), s.tests);
});

test('setiap field formulir muat batas 500 karakter', () => {
  for (const [name, value] of [
    ['qualify', qualifyField(s)],
    ['credits', creditsField()],
    ['extra', extraField(s)],
  ]) {
    assert.ok(value.length > 120, `${name} terlalu pendek`);
    assert.ok(value.length <= 500, `${name} ${value.length} karakter (maks 500)`);
  }
});

test('field menyebut kemampuan proyek, bukan klaim palsu', () => {
  const text = [qualifyField(s), creditsField(), extraField(s)].join(' ');
  assert.match(text, /test/);
  assert.match(text, /dependensi/);
  assert.doesNotMatch(text, /\d[\d.,]*\s*(star|bintang|unduhan|downloads)/i, 'jangan mengarang angka adopsi');
});

test('parseArgs menerima opsi repo/github dan menolak yang lain', () => {
  const args = parseArgs(['--repo', 'https://github.com/a/b', '--github', 'a']);
  assert.equal(args.repo, 'https://github.com/a/b');
  assert.equal(args.github, 'a');
  assert.throws(() => parseArgs(['--entah']), /tidak dikenal/);
});

test('dokumen aplikasi sudah dibuat dan sinkron dengan data', () => {
  const guide = path.join(__dirname, '..', 'docs', 'aplikasi-codex-oss.md');
  const fields = path.join(__dirname, '..', 'docs', 'aplikasi-field.md');
  assert.ok(fs.existsSync(guide), 'jalankan: node scripts/aplikasi.js');
  assert.ok(fs.existsSync(fields), 'jalankan: node scripts/aplikasi.js');
  const guideText = fs.readFileSync(guide, 'utf8');
  assert.ok(guideText.includes(`${s.total} ide`), 'jumlah ide di dokumen sudah usang');
  assert.ok(guideText.includes(`${s.tests} test`), 'jumlah test di dokumen sudah usang');
});
