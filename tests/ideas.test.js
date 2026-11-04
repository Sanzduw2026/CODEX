'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadIdeas, validateIdea, filterIdeas, pickRandom, categories,
  openaiFeatureCount, ideaToMarkdown, briefToMarkdown, toCSV, slugify, DIFFICULTIES, dataFiles,
} = require('../lib/ideas');
const { parseArgs, seededRng } = require('../cli');

const ideas = loadIdeas();

test('dataset ide valid dan tidak duplikat', () => {
  assert.ok(ideas.length >= 20, 'minimal 20 ide');
  const ids = new Set(ideas.map((i) => i.id));
  assert.equal(ids.size, ideas.length);
  for (const idea of ideas) assert.doesNotThrow(() => validateIdea(idea));
});

test('setiap ide punya minimal 3 butir MVP dan 2 target terukur', () => {
  for (const idea of ideas) {
    assert.ok(idea.mvp.length >= 3, `${idea.id}: MVP kurang`);
    assert.ok(idea.metrics.length >= 2, `${idea.id}: metrik kurang`);
    assert.ok(idea.risks.length >= 1, `${idea.id}: risiko kurang`);
    assert.ok(idea.prompt.length > 40, `${idea.id}: prompt terlalu pendek`);
  }
});

test('validateIdea menolak field yang hilang dan tingkat tak dikenal', () => {
  const broken = { ...ideas[0] };
  delete broken.mvp;
  assert.throws(() => validateIdea(broken), /mvp/);
  assert.throws(() => validateIdea({ ...ideas[0], difficulty: 'Sulit Sekali' }), /difficulty/);
  assert.throws(() => validateIdea({ ...ideas[0], id: 'Ada Spasi' }), /id/);
});

test('filter berdasarkan kategori, tingkat, tech, dan pencarian', () => {
  const cat = ideas[0].category;
  const byCat = filterIdeas(ideas, { category: cat });
  assert.ok(byCat.length > 0);
  assert.ok(byCat.every((i) => i.category === cat));

  const byLevel = filterIdeas(ideas, { difficulty: 'Menengah' });
  assert.ok(byLevel.every((i) => i.difficulty === 'Menengah'));

  const byTech = filterIdeas(ideas, { tech: 'realtime' });
  assert.ok(byTech.length > 0, 'harus menemukan fitur Realtime (case-insensitive)');

  const bySearch = filterIdeas(ideas, { search: 'kutipan' });
  assert.ok(bySearch.length > 0);

  assert.equal(filterIdeas(ideas, { search: 'zzz-tidak-ada' }).length, 0);
  assert.ok(DIFFICULTIES.every((d) => typeof d === 'string'));
});

test('pickRandom tanpa pengulangan dan menghormati batas', () => {
  const picked = pickRandom(ideas, 5, seededRng('uji'));
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((i) => i.id)).size, 5);
  assert.equal(pickRandom(ideas, 999).length, ideas.length);
  assert.deepEqual(pickRandom([], 3), []);
});

test('seed yang sama menghasilkan pilihan yang sama', () => {
  const a = pickRandom(ideas, 3, seededRng('seed-tetap')).map((i) => i.id);
  const b = pickRandom(ideas, 3, seededRng('seed-tetap')).map((i) => i.id);
  assert.deepEqual(a, b);
  const c = pickRandom(ideas, 3, seededRng('seed-lain')).map((i) => i.id);
  assert.notDeepEqual(a, c);
});

test('markdown ide memuat semua bagian penting', () => {
  const md = ideaToMarkdown(ideas[0]);
  for (const heading of ['## Ringkasan', '## Cakupan MVP', '## Target terukur', '## Risiko', '## Prompt awal']) {
    assert.ok(md.includes(heading), `heading hilang: ${heading}`);
  }
  assert.ok(md.includes(ideas[0].title));

  const brief = briefToMarkdown([ideas[0], ideas[1]], { filters: { difficulty: 'Menengah' } });
  assert.ok(brief.startsWith('# Brief Proyek OpenAI / Codex'));
  assert.ok(brief.includes('Jumlah ide: 2'));
});

test('CSV punya header dan jumlah baris benar, escape tanda kutip', () => {
  const csv = toCSV(ideas.slice(0, 3));
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 4);
  assert.ok(lines[0].startsWith('"id","title"'));
  const tricky = toCSV([{ ...ideas[0], title: 'Judul "kutip"' }]);
  assert.ok(tricky.includes('"Judul ""kutip"""'));
});

test('slugify aman untuk nama file', () => {
  assert.equal(slugify('Screenshot → Aplikasi Jalan'), 'screenshot-aplikasi-jalan');
  assert.equal(slugify('  '), 'brief');
});

test('kategori & hitungan fitur OpenAI konsisten', () => {
  const cats = categories(ideas);
  assert.deepEqual(cats, [...cats].sort());
  assert.equal(cats.length, new Set(ideas.map((i) => i.category)).size);
  const feats = openaiFeatureCount(ideas);
  assert.equal(feats.reduce((sum, [, n]) => sum + n, 0), ideas.reduce((sum, i) => sum + i.openaiFeatures.length, 0));
});

test('parseArgs membaca opsi dan menolak input salah', () => {
  const opts = parseArgs(['-n', '3', '--difficulty', 'Menengah', '--format=md', '--seed', 'abc']);
  assert.equal(opts.count, 3);
  assert.equal(opts.difficulty, 'Menengah');
  assert.equal(opts.format, 'md');
  assert.equal(opts.seed, 'abc');
  assert.throws(() => parseArgs(['--count', 'nol']), /--count/);
  assert.throws(() => parseArgs(['--format', 'xml']), /--format/);
  assert.throws(() => parseArgs(['--apa-ini']), /tidak dikenal/);
  assert.throws(() => parseArgs(['--category']), /butuh nilai/);
});

test('data terpecah per kategori dan konsisten', () => {
  const files = dataFiles();
  assert.equal(files.length, 11, 'harus ada 11 berkas kategori');
  const all = [];
  for (const file of files) {
    const ideas = loadIdeas(file);
    const category = ideas[0].category;
    assert.ok(ideas.every((i) => i.category === category), `${file}: kategori campur`);
    all.push(...ideas);
  }
  assert.equal(all.length, ideas.length);
  assert.equal(new Set(all.map((i) => i.id)).size, all.length);

  const byId = new Map(all.map((i) => [i.id, i]));
  assert.equal(byId.get('whatsapp-order-agent').difficulty, 'Menengah');
  assert.ok(byId.has('model-router-optimizer'));
  assert.ok(byId.has('pr-review-coach'));
});

test('berkas rusak atau bukan array ditolak dengan pesan jelas', () => {
  const os = require('node:os');
  const fs = require('node:fs');
  const path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ide-codex-'));
  const bad = path.join(dir, 'rusak.json');
  fs.writeFileSync(bad, '{ bukan json');
  assert.throws(() => loadIdeas(bad), /bukan JSON valid/);
  fs.writeFileSync(bad, '[]');
  assert.throws(() => loadIdeas(bad), /array ide/);
  fs.writeFileSync(bad, JSON.stringify([{ id: 'x' }]));
  assert.throws(() => loadIdeas(bad), /tidak punya field/);
  fs.rmSync(dir, { recursive: true, force: true });
});
