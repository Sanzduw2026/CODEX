'use strict';

/**
 * Lint isi katalog. Melengkapi `validateIdea()` (yang memeriksa bentuk data)
 * dengan pemeriksaan **mutu tulisan**: apakah sebuah ide cukup tajam untuk
 * dikerjakan, atau hanya terdengar bagus.
 *
 * Aturan dikelompokkan per tingkat:
 *   error — melanggar akan menggagalkan CI (`npm run lint:data`)
 *   warn  — sinyal perbaikan, tidak menggagalkan
 *
 * Semua aturan murni (tanpa I/O) agar mudah dites.
 */

const MIN_RISK_LENGTH = 20;
const MIN_SUMMARY_LENGTH = 80;
const MAX_TAGLINE_LENGTH = 90;
const MAX_TITLE_LENGTH = 60;
const MIN_MVP = 3;
const MIN_STRETCH = 2;
const MIN_PROMPT_LENGTH = 80;

/** Kata yang membuat risiko/metrik terlalu umum untuk berguna. */
const VAGUE_PATTERNS = [
  /^(bisa|dapat) gagal$/i,
  /^kompleks$/i,
  /^sulit$/i,
  /^berisiko$/i,
  /^butuh waktu$/i,
  /^tidak ada$/i,
];

/** Angka mati atau syarat mutlak yang sah menggantikan angka. */
const ABSOLUTE_OK = /(tidak ada|tanpa|nol|\b0\b)/i;

/**
 * Periksa satu ide.
 * @returns {{level: 'error'|'warn', rule: string, message: string}[]}
 */
function lintIdea(idea) {
  const findings = [];
  const add = (level, rule, message) => findings.push({ level, rule, message });
  const id = idea?.id ?? '?';

  if (typeof idea?.title === 'string') {
    if (idea.title.length > MAX_TITLE_LENGTH) {
      add('warn', 'title-panjang', `judul ${idea.title.length} karakter (maks ${MAX_TITLE_LENGTH})`);
    }
    if (/^\s|\s$/.test(idea.title)) add('warn', 'spasi-berlebih', 'judul punya spasi di ujung');
  }

  if (typeof idea?.tagline === 'string' && idea.tagline.length > MAX_TAGLINE_LENGTH) {
    add('warn', 'tagline-panjang', `tagline ${idea.tagline.length} karakter (maks ${MAX_TAGLINE_LENGTH})`);
  }

  if (typeof idea?.summary === 'string' && idea.summary.length < MIN_SUMMARY_LENGTH) {
    add('error', 'ringkasan-tipis', `ringkasan ${idea.summary.length} karakter (min ${MIN_SUMMARY_LENGTH})`);
  }

  if (typeof idea?.prompt === 'string' && idea.prompt.length < MIN_PROMPT_LENGTH) {
    add('error', 'prompt-tipis', `prompt ${idea.prompt.length} karakter (min ${MIN_PROMPT_LENGTH})`);
  }

  if (Array.isArray(idea?.mvp) && idea.mvp.length < MIN_MVP) {
    add('error', 'mvp-kurang', `cakupan MVP ${idea.mvp.length} butir (min ${MIN_MVP})`);
  }

  if (Array.isArray(idea?.stretch) && idea.stretch.length < MIN_STRETCH) {
    add('warn', 'stretch-kurang', `pengembangan lanjutan ${idea.stretch.length} butir (min ${MIN_STRETCH})`);
  }

  for (const [index, risk] of (idea?.risks ?? []).entries()) {
    if (typeof risk !== 'string') {
      add('error', 'risiko-bukan-teks', `risiko #${index + 1} bukan teks`);
      continue;
    }
    const trimmed = risk.trim();
    if (trimmed.length < MIN_RISK_LENGTH) {
      add('error', 'risiko-umum', `risiko terlalu pendek (${trimmed.length} < ${MIN_RISK_LENGTH}): "${trimmed}"`);
    } else if (VAGUE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      add('error', 'risiko-umum', `risiko terlalu umum: "${trimmed}"`);
    }
    if (!/[a-z]/.test(trimmed)) add('warn', 'risiko-kapital', `risiko tanpa huruf kecil: "${trimmed}"`);
  }

  for (const [index, metric] of (idea?.metrics ?? []).entries()) {
    if (typeof metric !== 'string') {
      add('error', 'metrik-bukan-teks', `metrik #${index + 1} bukan teks`);
      continue;
    }
    const base = metric.split(' → bukti:')[0].trim();
    if (!/[0-9]/.test(base) && !ABSOLUTE_OK.test(base)) {
      add('error', 'metrik-tanpa-angka', `metrik tanpa angka/syarat mutlak: "${base}"`);
    }
    if (metric.includes('→ bukti:') && metric.split('→ bukti:')[1].trim().length < 6) {
      add('warn', 'bukti-tipis', `bukti verifikasi terlalu pendek: "${metric}"`);
    }
  }

  for (const field of ['stack', 'openaiFeatures']) {
    const values = idea?.[field];
    if (!Array.isArray(values)) continue;
    const seen = new Set();
    for (const value of values) {
      const key = String(value).trim().toLowerCase();
      if (seen.has(key)) add('error', `${field}-duplikat`, `nilai ganda: "${value}"`);
      seen.add(key);
      if (value !== String(value).trim()) add('warn', `${field}-spasi`, `spasi berlebih: "${value}"`);
      if (String(value).length > 40) add('warn', `${field}-panjang`, `nama terlalu panjang: "${value}"`);
    }
  }

  if (typeof idea?.timeframe === 'string' && !/\d/.test(idea.timeframe)) {
    add('warn', 'timeframe-tanpa-angka', `estimasi tanpa angka: "${idea.timeframe}"`);
  }

  if (typeof idea?.category === 'string' && idea.category.trim() !== idea.category) {
    add('warn', 'kategori-spasi', `kategori punya spasi di ujung: "${idea.category}"`);
  }

  return findings;
}

/**
 * Periksa seluruh katalog: termasuk duplikasi judul, id yang mirip, dan
 * kategori yang hanya berisi satu ide (bukan kesalahan, tetapi sinyal).
 */
function lintCatalog(ideas) {
  const results = ideas.map((idea) => ({ id: idea.id, findings: lintIdea(idea) }));

  const byTitle = new Map();
  const byIdPrefix = new Map();
  for (const idea of ideas) {
    const titleKey = String(idea.title).trim().toLowerCase();
    if (byTitle.has(titleKey)) {
      results.push({
        id: idea.id,
        findings: [{ level: 'error', rule: 'judul-duplikat', message: `judul sama dengan ${byTitle.get(titleKey)}` }],
      });
    } else {
      byTitle.set(titleKey, idea.id);
    }

    const prefix = String(idea.id).split('-')[0];
    byIdPrefix.set(prefix, [...(byIdPrefix.get(prefix) ?? []), idea.id]);
  }

  const counts = new Map();
  for (const idea of ideas) counts.set(idea.category, (counts.get(idea.category) ?? 0) + 1);
  for (const idea of ideas) {
    if (counts.get(idea.category) === 1) {
      results.push({
        id: idea.id,
        findings: [{
          level: 'warn',
          rule: 'kategori-tunggal',
          message: `kategori "${idea.category}" baru berisi 1 ide`,
        }],
      });
    }
  }

  // Id yang hanya beda imbuhan biasanya tanda ide yang tumpang tindih.
  for (const [prefix, ids] of byIdPrefix) {
    if (ids.length > 3) {
      results.push({
        id: prefix,
        findings: [{
          level: 'warn',
          rule: 'id-berkerabat',
          message: `${ids.length} id berawalan "${prefix}": ${ids.join(', ')}`,
        }],
      });
    }
  }

  return results.filter((entry) => entry.findings.length > 0);
}

function summarize(results) {
  let errors = 0;
  let warns = 0;
  for (const entry of results) {
    for (const finding of entry.findings) {
      if (finding.level === 'error') errors += 1;
      else warns += 1;
    }
  }
  return { errors, warns, ideTerkena: results.length };
}

function formatReport(results) {
  if (results.length === 0) return 'Lint katalog: tidak ada temuan. 👍\n';
  const lines = [];
  for (const entry of results) {
    lines.push(`${entry.id}`);
    for (const finding of entry.findings) {
      const mark = finding.level === 'error' ? 'ERROR' : 'warn ';
      lines.push(`  ${mark} [${finding.rule}] ${finding.message}`);
    }
  }
  const { errors, warns, ideTerkena } = summarize(results);
  lines.push('');
  lines.push(`${errors} error, ${warns} peringatan, ${ideTerkena} ide terdampak.`);
  return `${lines.join('\n')}\n`;
}

module.exports = {
  lintIdea,
  lintCatalog,
  summarize,
  formatReport,
  MIN_RISK_LENGTH,
  MIN_SUMMARY_LENGTH,
  MIN_STRETCH,
  MIN_MVP,
  MIN_PROMPT_LENGTH,
  MAX_TAGLINE_LENGTH,
  MAX_TITLE_LENGTH,
  VAGUE_PATTERNS,
};
