#!/usr/bin/env node
'use strict';

/**
 * codex-idea — generator ide proyek OpenAI/Codex secara acak.
 *
 * Contoh:
 *   node cli.js
 *   node cli.js --count 3 --difficulty Pemula
 *   node cli.js --category "Codex / Developer Tools" --json
 *   node cli.js --seed "klinik" --format md --out brief.md
 *   node cli.js --list
 *   node cli.js --id doc-qa-citations --format md
 */

const fs = require('node:fs');
const path = require('node:path');
const {
  loadIdeas, filterIdeas, pickRandom, categories, openaiFeatureCount,
  ideaToMarkdown, briefToMarkdown, toCSV,
} = require('./lib/ideas');

const HELP = `codex-idea — ide proyek OpenAI/Codex acak & terkurasi

Pemakaian:
  node cli.js [opsi]

Opsi:
  -n, --count <n>         Jumlah ide (default 1)
      --category <nama>   Filter kategori (lihat --list)
      --difficulty <lvl>  Pemula | Pemula–Menengah | Menengah | Lanjutan
      --tech <kata>       Filter berdasarkan stack/fitur OpenAI
      --search <kata>     Cari di judul, ringkasan, metrik, dll.
      --seed <teks>       Seed acak agar hasil bisa direproduksi
      --id <slug>         Ambil ide tertentu (boleh lebih dari satu, pisah koma)
      --list              Tampilkan kategori + fitur OpenAI
      --json              Output JSON
      --format <fmt>      text | json | md | csv (default text)
  -o, --out <file>        Tulis ke file, bukan stdout
  -h, --help              Bantuan ini

Contoh:
  node cli.js -n 3 --difficulty Menengah
  node cli.js --category "RAG & Knowledge" --format md -o brief.md
  node cli.js --tech "Realtime" -n 2
`;

function parseArgs(argv) {
  const opts = { count: 1, format: 'text' };
  const takesValue = new Set(['--count', '-n', '--category', '--difficulty', '--tech', '--search', '--seed', '--id', '--format', '-o', '--out']);
  for (let i = 0; i < argv.length; i += 1) {
    let arg = argv[i];
    let value;
    if (arg.includes('=') && arg.startsWith('--')) {
      const idx = arg.indexOf('=');
      value = arg.slice(idx + 1);
      arg = arg.slice(0, idx);
    }
    if (arg === '-h' || arg === '--help') { opts.help = true; continue; }
    if (arg === '--list') { opts.list = true; continue; }
    if (arg === '--json') { opts.format = 'json'; continue; }
    if (takesValue.has(arg)) {
      if (value === undefined) {
        value = argv[i + 1];
        i += 1;
      }
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`opsi ${arg} butuh nilai`);
      }
      switch (arg) {
        case '--count': case '-n': opts.count = Number.parseInt(value, 10); break;
        case '--category': opts.category = value; break;
        case '--difficulty': opts.difficulty = value; break;
        case '--tech': opts.tech = value; break;
        case '--search': opts.search = value; break;
        case '--seed': opts.seed = value; break;
        case '--id': opts.ids = value.split(',').map((s) => s.trim()).filter(Boolean); break;
        case '--format': opts.format = value.toLowerCase(); break;
        case '-o': case '--out': opts.out = value; break;
        default: break;
      }
      continue;
    }
    throw new Error(`argumen tidak dikenal: ${arg}`);
  }
  if (!Number.isInteger(opts.count) || opts.count < 1) {
    throw new Error('--count harus bilangan bulat >= 1');
  }
  if (!['text', 'json', 'md', 'csv'].includes(opts.format)) {
    throw new Error(`--format tidak dikenal: ${opts.format} (pakai text|json|md|csv)`);
  }
  return opts;
}

/** PRNG deterministik (mulberry32) dari string seed. */
function seededRng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatText(ideas) {
  return ideas.map((idea, index) => {
    const block = [
      `${index + 1}. ${idea.title}`,
      `   ${idea.tagline}`,
      `   ${idea.category} · ${idea.difficulty} · ${idea.timeframe}`,
      `   OpenAI: ${idea.openaiFeatures.join(', ')}`,
      `   Stack: ${idea.stack.join(', ')}`,
      '',
      `   MVP:`,
      ...idea.mvp.map((m) => `   - ${m}`),
      '',
      `   Target: ${idea.metrics.join(' | ')}`,
      `   Prompt awal: ${idea.prompt}`,
      `   Detail lengkap: node cli.js --id ${idea.id} --format md`,
    ].join('\n');
    return block;
  }).join('\n\n' + '─'.repeat(64) + '\n\n');
}

function listInfo(ideas) {
  const cats = categories(ideas);
  const feats = openaiFeatureCount(ideas);
  const lines = ['Kategori:'];
  for (const category of cats) {
    const count = ideas.filter((i) => i.category === category).length;
    lines.push(`  - ${category} (${count})`);
  }
  lines.push('', 'Fitur OpenAI (jumlah ide yang memakai):');
  for (const [feature, count] of feats) {
    lines.push(`  - ${feature} (${count})`);
  }
  lines.push('', `Total ide: ${ideas.length}`, '', 'Semua ide:');
  for (const idea of ideas) {
    lines.push(`  ${idea.id.padEnd(28)} ${idea.title} [${idea.difficulty}]`);
  }
  return lines.join('\n');
}

function main(argv = process.argv.slice(2)) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n\n${HELP}`);
    return 2;
  }
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const all = loadIdeas();
  if (opts.list) {
    process.stdout.write(listInfo(all) + '\n');
    return 0;
  }

  let selected;
  if (opts.ids && opts.ids.length) {
    selected = opts.ids.map((id) => {
      const found = all.find((i) => i.id === id);
      if (!found) throw new Error(`ide tidak ditemukan: ${id}`);
      return found;
    });
  } else {
    const candidates = filterIdeas(all, {
      category: opts.category,
      difficulty: opts.difficulty,
      tech: opts.tech,
      search: opts.search,
    });
    if (candidates.length === 0) {
      process.stderr.write('Tidak ada ide yang cocok dengan filter. Coba --list untuk melihat pilihan.\n');
      return 1;
    }
    const rng = opts.seed ? seededRng(opts.seed) : Math.random;
    selected = pickRandom(candidates, opts.count, rng);
  }

  const filters = {
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.difficulty ? { difficulty: opts.difficulty } : {}),
    ...(opts.tech ? { tech: opts.tech } : {}),
    ...(opts.search ? { search: opts.search } : {}),
    ...(opts.seed ? { seed: opts.seed } : {}),
  };

  let output;
  switch (opts.format) {
    case 'json':
      output = JSON.stringify({ generatedAt: new Date().toISOString(), filters, count: selected.length, ideas: selected }, null, 2) + '\n';
      break;
    case 'md':
      output = selected.length === 1 && opts.ids
        ? ideaToMarkdown(selected[0])
        : briefToMarkdown(selected, { filters });
      break;
    case 'csv':
      output = toCSV(selected);
      break;
    default:
      output = formatText(selected) + '\n';
  }

  if (opts.out) {
    const target = path.resolve(process.cwd(), opts.out);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, output, 'utf8');
    process.stdout.write(`Ditulis ke ${path.relative(process.cwd(), target) || target}\n`);
  } else {
    process.stdout.write(output);
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

module.exports = { main, parseArgs, seededRng };
