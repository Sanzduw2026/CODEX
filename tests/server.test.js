'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');

let server;
let base;

test.before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

test('halaman utama tersaji sebagai HTML', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.ok(html.includes('Ide Codex'));
});

test('/api/meta mengembalikan kategori dan total', async () => {
  const res = await fetch(`${base}/api/meta`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.total > 0);
  assert.ok(Array.isArray(data.categories));
  assert.equal(data.categories.reduce((sum, c) => sum + c.count, 0), data.total);
});

test('/api/random menghormati filter dan count', async () => {
  const meta = await (await fetch(`${base}/api/meta`)).json();
  const category = meta.categories[0].name;
  const res = await fetch(`${base}/api/random?count=1&category=${encodeURIComponent(category)}`);
  const data = await res.json();
  assert.equal(data.ideas.length, 1);
  assert.equal(data.ideas[0].category, category);
});

test('/api/random dengan count melebihi jumlah tetap aman', async () => {
  const res = await fetch(`${base}/api/random?count=999`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.ideas.length >= 10);
  assert.equal(new Set(data.ideas.map((i) => i.id)).size, data.ideas.length);
});

test('/api/ideas/:id dan 404 untuk id tak dikenal', async () => {
  const res = await fetch(`${base}/api/ideas/doc-qa-citations`);
  assert.equal(res.status, 200);
  const idea = await res.json();
  assert.equal(idea.id, 'doc-qa-citations');
  const missing = await fetch(`${base}/api/ideas/tidak-ada`);
  assert.equal(missing.status, 404);
});

test('input buruk ditolak dengan 400', async () => {
  const badCount = await fetch(`${base}/api/random?count=0`);
  assert.equal(badCount.status, 400);
  const badFormat = await fetch(`${base}/api/export?format=xml`);
  assert.equal(badFormat.status, 400);
});

test('ekspor md, json, csv mengirim lampiran', async () => {
  for (const format of ['md', 'json', 'csv']) {
    const res = await fetch(`${base}/api/export?format=${format}&count=2`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-disposition'), /attachment/);
    const body = await res.text();
    assert.ok(body.length > 50, `${format} kosong`);
  }
});

test('path traversal ditolak', async () => {
  const res = await fetch(`${base}/..%2f..%2fpackage.json`);
  assert.ok([403, 404].includes(res.status));
});

test('gambar sosial tersaji dari folder assets', async () => {
  const res = await fetch(`${base}/assets/og-image.svg`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/svg\+xml/);
  const svg = await res.text();
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Ide Codex'));
  const total = require('../lib/ideas').loadIdeas().length;
  assert.ok(svg.includes(`${total} ide proyek OpenAI/Codex`), 'jumlah ide di gambar usang');
});

test('aset di luar assets/ tidak bocor', async () => {
  const res = await fetch(`${base}/assets/..%2fpackage.json`);
  assert.ok([403, 404].includes(res.status));
});

test('/healthz hidup', async () => {
  const res = await fetch(`${base}/healthz`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});
