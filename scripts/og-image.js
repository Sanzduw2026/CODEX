'use strict';

/**
 * Membuat gambar sosial (assets/og-image.svg + .png) tanpa dependensi,
 * berisi ringkasan katalog. PNG dibuat lewat ImageMagick bila tersedia;
 * bila tidak, hanya SVG yang dihasilkan.
 *
 * Pemakaian: node scripts/og-image.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { loadIdeas, categories, openaiFeatureCount } = require('../lib/ideas');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets');

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSvg(ideas) {
  const total = ideas.length;
  const cats = categories(ideas).length;
  const feats = openaiFeatureCount(ideas).length;
  const badges = openaiFeatureCount(ideas).slice(0, 6);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Ide Codex — ${total} ide proyek OpenAI">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1020"/>
      <stop offset="100%" stop-color="#1a2340"/>
    </linearGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#ffffff" opacity="0.10"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <g font-family="DejaVu Sans, Helvetica, Arial, sans-serif">
    <rect x="72" y="72" width="64" height="64" rx="16" fill="#b8f24a"/>
    <text x="104" y="118" font-size="30" font-weight="bold" fill="#0b1020" text-anchor="middle" font-family="DejaVu Sans Mono, monospace">{ }</text>

    <text x="156" y="118" font-size="30" font-weight="bold" fill="#f6f4ee">Ide Codex</text>
    <text x="72" y="248" font-size="76" font-weight="bold" fill="#f6f4ee">Bingung mau bikin apa?</text>
    <text x="72" y="326" font-size="76" font-weight="bold" fill="#b8f24a">Putar roda idenya.</text>

    <text x="72" y="392" font-size="28" fill="#c9cee0">${total} ide proyek OpenAI/Codex · ${cats} kategori · ${feats} kemampuan OpenAI</text>
    <text x="72" y="434" font-size="26" fill="#9aa3bd">CLI + API + UI, nol dependensi, siap diekspor jadi brief.</text>

    ${badges.map(([name], i) => {
    const x = 72 + (i % 3) * 340;
    const y = 490 + Math.floor(i / 3) * 52;
    const w = 300;
    return `<g>
      <rect x="${x}" y="${y}" width="${w}" height="38" rx="19" fill="#12182a" stroke="#2a3350"/>
      <text x="${x + 20}" y="${y + 26}" font-size="19" fill="#dfe3d2">${esc(name)}</text>
    </g>`;
  }).join('\n    ')}

    <text x="1128" y="576" font-size="22" fill="#8b7cf6" text-anchor="end">github.com/Sanzduw2026/CODEX</text>
  </g>
</svg>
`;
}

function main() {
  const ideas = loadIdeas();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const svgPath = path.join(OUT_DIR, 'og-image.svg');
  fs.writeFileSync(svgPath, buildSvg(ideas), 'utf8');
  process.stdout.write(`Ditulis: assets/og-image.svg (${ideas.length} ide)\n`);

  const pngPath = path.join(OUT_DIR, 'og-image.png');
  try {
    execFileSync('convert', ['-background', '#0b1020', svgPath, pngPath], { stdio: 'pipe' });
    // ImageMagick tanpa delegasi SVG (librsvg) menghasilkan berkas kosong: tolak.
    if (!fs.existsSync(pngPath) || fs.statSync(pngPath).size < 5000) {
      fs.rmSync(pngPath, { force: true });
      throw new Error('hasil PNG kosong');
    }
    process.stdout.write('Ditulis: assets/og-image.png\n');
  } catch {
    process.stdout.write('ImageMagick tidak tersedia — PNG dilewati (SVG tetap dibuat).\n');
  }
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

module.exports = { buildSvg, main };
