'use strict';

/**
 * Inti generator ide: pemuatan data, filter, pemilihan acak berbobot,
 * dan pembuatan dokumen brief (Markdown) dari sebuah ide.
 * Semua fungsi murni/sinkron agar mudah dites (lihat tests/).
 */

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'ideas');

const DIFFICULTIES = ['Pemula', 'Pemula–Menengah', 'Menengah', 'Lanjutan'];

let cache = null;

/** Daftar berkas sumber ide (satu berkas per kategori agar enak dikelola). */
function dataFiles(dir = DATA_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(dir, name));
}

/**
 * Muat semua ide dari `data/ideas/*.json`.
 * Bila `dataPath` diisi, hanya berkas itu yang dibaca (dipakai untuk uji).
 */
function loadIdeas(dataPath) {
  if (!dataPath && cache) return cache;

  const files = dataPath ? [dataPath] : dataFiles();
  if (files.length === 0) {
    throw new Error(`tidak ada berkas ide di ${DATA_DIR}`);
  }

  const ideas = [];
  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      throw new Error(`${path.basename(file)} bukan JSON valid: ${error.message}`);
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(`${path.basename(file)} harus berisi array ide yang tidak kosong`);
    }
    for (const idea of parsed) {
      validateIdea(idea, path.basename(file));
      ideas.push(idea);
    }
  }

  const seen = new Set();
  for (const idea of ideas) {
    if (seen.has(idea.id)) throw new Error(`id duplikat: ${idea.id}`);
    seen.add(idea.id);
  }

  if (!dataPath) cache = ideas;
  return ideas;
}

function validateIdea(idea, source = '?') {
  if (typeof idea !== 'object' || idea === null) {
    throw new Error(`${source}: entri ide harus objek`);
  }
  const required = ['id', 'title', 'tagline', 'category', 'difficulty', 'timeframe', 'summary', 'why', 'stack', 'openaiFeatures', 'mvp', 'stretch', 'metrics', 'risks', 'prompt'];
  for (const key of required) {
    if (idea[key] === undefined || idea[key] === null) {
      throw new Error(`${source}: ide "${idea.id ?? '?'}" tidak punya field "${key}"`);
    }
  }
  if (!/^[a-z0-9-]+$/.test(idea.id)) {
    throw new Error(`${source}: id tidak valid (harus slug huruf kecil): ${idea.id}`);
  }
  if (!DIFFICULTIES.includes(idea.difficulty)) {
    throw new Error(`${source}: difficulty "${idea.difficulty}" tidak dikenal (id: ${idea.id})`);
  }
  for (const key of ['stack', 'openaiFeatures', 'mvp', 'stretch', 'metrics', 'risks']) {
    if (!Array.isArray(idea[key]) || idea[key].length === 0) {
      throw new Error(`${source}: ide "${idea.id}" field "${key}" harus array tidak kosong`);
    }
  }
}

/** Filter opsional: kategori, tingkat kesulitan, teknologi, dan pencarian teks. */
function filterIdeas(ideas, { category, difficulty, tech, search } = {}) {
  const q = (search || '').trim().toLowerCase();
  return ideas.filter((idea) => {
    if (category && idea.category !== category) return false;
    if (difficulty && idea.difficulty !== difficulty) return false;
    if (tech) {
      const t = tech.toLowerCase();
      const hay = [...idea.stack, ...idea.openaiFeatures].join(' ').toLowerCase();
      if (!hay.includes(t)) return false;
    }
    if (q) {
      const hay = [idea.title, idea.tagline, idea.summary, idea.why, idea.category, idea.difficulty,
        ...idea.stack, ...idea.openaiFeatures, ...idea.metrics].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Pemilihan acak tanpa pengulangan; `count` dibatasi jumlah kandidat. */
function pickRandom(items, count, rng = Math.random) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const n = Math.max(0, Math.min(Number.isInteger(count) ? count : 1, items.length));
  const pool = items.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function categories(ideas) {
  return [...new Set(ideas.map((i) => i.category))].sort();
}

function openaiFeatureCount(ideas) {
  const map = new Map();
  for (const idea of ideas) {
    for (const feature of idea.openaiFeatures) {
      map.set(feature, (map.get(feature) || 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function checklist(idea) {
  return [...idea.mvp];
}

function ideaToMarkdown(idea) {
  const lines = [];
  lines.push(`# ${idea.title} (${idea.id})`, '');
  lines.push(`> ${idea.tagline}`, '');
  lines.push(`**Kategori:** ${idea.category}  `);
  lines.push(`**Tingkat:** ${idea.difficulty}  `);
  lines.push(`**Estimasi:** ${idea.timeframe}`, '');
  lines.push('## Ringkasan', '', idea.summary, '');
  lines.push('## Kenapa layak dikerjakan', '', idea.why, '');
  lines.push('## Stack', '');
  lines.push(idea.stack.map((s) => `- ${s}`).join('\n'), '');
  lines.push('## Kemampuan OpenAI yang dipakai', '');
  lines.push(idea.openaiFeatures.map((s) => `- ${s}`).join('\n'), '');
  lines.push('## Cakupan MVP', '');
  lines.push(idea.mvp.map((s, i) => `${i + 1}. ${s}`).join('\n'), '');
  lines.push('## Pengembangan lanjutan', '');
  lines.push(idea.stretch.map((s) => `- ${s}`).join('\n'), '');
  lines.push('## Target terukur', '');
  lines.push(idea.metrics.map((s) => `- [ ] ${s}`).join('\n'), '');
  lines.push('## Risiko & cara meredamnya', '');
  lines.push(idea.risks.map((s) => `- ${s}`).join('\n'), '');
  lines.push('## Prompt awal (system)', '', '```text', idea.prompt, '```', '');
  return lines.join('\n');
}

function briefToMarkdown(ideas, meta = {}) {
  const now = meta.generatedAt || new Date().toISOString();
  const lines = [
    '# Brief Proyek OpenAI / Codex',
    '',
    `Dibuat: ${now}`,
    `Jumlah ide: ${ideas.length}`,
    '',
  ];
  if (meta.filters && Object.keys(meta.filters).length) {
    lines.push('Filter:', '', '```json', JSON.stringify(meta.filters, null, 2), '```', '');
  }
  lines.push('---', '');
  for (const idea of ideas) {
    lines.push(ideaToMarkdown(idea), '---', '');
  }
  return lines.join('\n');
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'brief';
}

function toCSV(ideas) {
  const head = ['id', 'title', 'category', 'difficulty', 'timeframe', 'stack', 'openaiFeatures', 'tagline'];
  const esc = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = ideas.map((idea) => [
    idea.id,
    idea.title,
    idea.category,
    idea.difficulty,
    idea.timeframe,
    idea.stack.join('; '),
    idea.openaiFeatures.join('; '),
    idea.tagline,
  ].map(esc).join(','));
  return [head.map(esc).join(','), ...rows].join('\n') + '\n';
}

module.exports = {
  DATA_DIR,
  DIFFICULTIES,
  dataFiles,
  loadIdeas,
  validateIdea,
  filterIdeas,
  pickRandom,
  categories,
  openaiFeatureCount,
  checklist,
  ideaToMarkdown,
  briefToMarkdown,
  toCSV,
  slugify,
};
