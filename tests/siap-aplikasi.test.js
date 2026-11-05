'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, ringkas, line } = require('../scripts/siap-aplikasi');

test('parseArgs menerima URL repo lengkap dan menormalkannya', () => {
  assert.equal(parseArgs(['--repo', 'https://github.com/a/b.git']).repo, 'a/b');
  assert.equal(parseArgs(['--repo', 'a/b/']).repo, 'a/b');
  assert.equal(parseArgs([]).repo, 'Sanzduw2026/CODEX');
  assert.equal(parseArgs(['--insecure']).insecure, true);
  assert.throws(() => parseArgs(['--repo', 'bukan-repo']), /format repo/);
  assert.throws(() => parseArgs(['--apa']), /tidak dikenal/);
});

test('line memberi penanda sesuai status', () => {
  assert.ok(line('ok', 'A').startsWith('✅'));
  assert.ok(line('warn', 'B').startsWith('⚠️'));
  assert.ok(line('fail', 'C').startsWith('❌'));
  assert.ok(line('ok', 'A', 'detail').endsWith('— detail'));
});

test('ringkas menyimpulkan siap/tidak siap dengan benar', () => {
  const base = {
    info: { full_name: 'a/b', stargazers_count: 3, forks_count: 0 },
    checks: [
      { wajib: true, status: 'ok', label: 'Repositori publik', detail: 'a/b' },
      { wajib: false, status: 'warn', label: 'Rilis/tag', detail: 'belum ada' },
    ],
  };
  const teks = ringkas(base);
  assert.match(teks, /Siap diajukan/);
  assert.match(teks, /openai\.com\/form\/codex-for-oss/);
  assert.match(teks, /docs\/aplikasi-field\.md/);

  base.checks[0].status = 'fail';
  assert.match(ringkas(base), /Belum siap: Repositori publik/);
});
