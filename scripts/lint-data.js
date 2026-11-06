'use strict';

/**
 * Lint isi katalog lewat CLI.
 *
 *   node scripts/lint-data.js            # laporan + kode keluar 1 bila ada error
 *   node scripts/lint-data.js --warn     # anggap peringatan sebagai kegagalan
 *   node scripts/lint-data.js --json     # keluaran mesin
 *
 * Selalu membaca data terbaru dari data/ideas/*.json.
 */

const { loadIdeas } = require('../lib/ideas');
const { lintCatalog, summarize, formatReport } = require('../lib/lint');

function main(argv = process.argv.slice(2)) {
  const json = argv.includes('--json');
  const strict = argv.includes('--warn') || argv.includes('--strict');
  const unknown = argv.filter((a) => !['--json', '--warn', '--strict', '--help', '-h'].includes(a));
  if (unknown.length) {
    process.stderr.write(`argumen tidak dikenal: ${unknown.join(' ')}\n`);
    return 2;
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write('Pemakaian: node scripts/lint-data.js [--json] [--warn]\n');
    return 0;
  }

  const ideas = loadIdeas();
  const results = lintCatalog(ideas);
  const ringkasan = summarize(results);

  if (json) {
    process.stdout.write(`${JSON.stringify({ total: ideas.length, ringkasan, results }, null, 2)}\n`);
  } else {
    process.stdout.write(`Memeriksa ${ideas.length} ide…\n\n`);
    process.stdout.write(formatReport(results));
  }

  if (ringkasan.errors > 0) return 1;
  if (strict && ringkasan.warns > 0) return 1;
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

module.exports = { main };
