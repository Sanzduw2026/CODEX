'use strict';

/**
 * Server tanpa dependensi: menyajikan UI statis + API kecil di /api.
 * Bind ke 0.0.0.0 agar bisa dibuka lewat live preview.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const {
  loadIdeas, filterIdeas, pickRandom, categories, openaiFeatureCount,
  ideaToMarkdown, briefToMarkdown, toCSV, slugify,
} = require('./lib/ideas');

const PORT = Number.parseInt(process.env.PORT || '4173', 10);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, buffer) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 — tidak ditemukan');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buffer);
  });
}

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const resolved = path.resolve(PUBLIC_DIR, rel);
  if (!resolved.startsWith(PUBLIC_DIR + path.sep) && resolved !== path.join(PUBLIC_DIR, 'index.html')) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('403 — akses ditolak');
    return;
  }
  sendFile(res, resolved);
}

function collectQuery(searchParams) {
  return {
    category: searchParams.get('category') || undefined,
    difficulty: searchParams.get('difficulty') || undefined,
    tech: searchParams.get('tech') || undefined,
    search: searchParams.get('search') || undefined,
  };
}

function attach(res, filename, body, type) {
  res.writeHead(200, {
    'content-type': `${type}; charset=utf-8`,
    'content-disposition': `attachment; filename="${filename}"`,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function handleApi(req, res, url) {
  const ideas = loadIdeas();
  const query = collectQuery(url.searchParams);

  if (url.pathname === '/api/meta') {
    sendJson(res, 200, {
      total: ideas.length,
      categories: categories(ideas).map((category) => ({
        name: category,
        count: ideas.filter((i) => i.category === category).length,
      })),
      difficulties: [...new Set(ideas.map((i) => i.difficulty))],
      openaiFeatures: openaiFeatureCount(ideas).map(([name, count]) => ({ name, count })),
    });
    return true;
  }

  if (url.pathname === '/api/ideas') {
    let result = filterIdeas(ideas, query);
    const shuffle = url.searchParams.get('shuffle') === '1';
    const countParam = url.searchParams.get('count');
    if (countParam) {
      const count = Number.parseInt(countParam, 10);
      if (!Number.isInteger(count) || count < 1) {
        sendJson(res, 400, { error: 'count harus bilangan bulat >= 1' });
        return true;
      }
      result = shuffle ? pickRandom(result, count) : result.slice(0, count);
    }
    sendJson(res, 200, { total: result.length, ideas: result });
    return true;
  }

  if (url.pathname === '/api/random') {
    const count = Number.parseInt(url.searchParams.get('count') || '1', 10);
    if (!Number.isInteger(count) || count < 1) {
      sendJson(res, 400, { error: 'count harus bilangan bulat >= 1' });
      return true;
    }
    const candidates = filterIdeas(ideas, query);
    if (candidates.length === 0) {
      sendJson(res, 404, { error: 'tidak ada ide yang cocok dengan filter' });
      return true;
    }
    sendJson(res, 200, { ideas: pickRandom(candidates, count) });
    return true;
  }

  const idMatch = url.pathname.match(/^\/api\/ideas\/([a-z0-9-]+)$/);
  if (idMatch) {
    const found = ideas.find((i) => i.id === idMatch[1]);
    if (!found) {
      sendJson(res, 404, { error: `ide tidak ditemukan: ${idMatch[1]}` });
      return true;
    }
    sendJson(res, 200, found);
    return true;
  }

  if (url.pathname === '/api/export') {
    const format = (url.searchParams.get('format') || 'md').toLowerCase();
    let selected = filterIdeas(ideas, query);
    const ids = url.searchParams.get('ids');
    const count = url.searchParams.get('count');
    if (ids) {
      const wanted = ids.split(',').map((s) => s.trim()).filter(Boolean);
      selected = wanted.map((id) => ideas.find((i) => i.id === id)).filter(Boolean);
    } else if (count) {
      selected = pickRandom(selected, Number.parseInt(count, 10) || 1);
    }
    if (selected.length === 0) {
      sendJson(res, 404, { error: 'tidak ada ide untuk diekspor' });
      return true;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'json') {
      attach(res, `ide-codex-${stamp}.json`, JSON.stringify({ generatedAt: new Date().toISOString(), ideas: selected }, null, 2), 'application/json');
      return true;
    }
    if (format === 'csv') {
      attach(res, `ide-codex-${stamp}.csv`, toCSV(selected), 'text/csv');
      return true;
    }
    if (format === 'md') {
      const body = selected.length === 1 && ids
        ? ideaToMarkdown(selected[0])
        : briefToMarkdown(selected);
      const name = selected.length === 1 && ids ? `${slugify(selected[0].title)}.md` : `brief-codex-${stamp}.md`;
      attach(res, name, body, 'text/markdown');
      return true;
    }
    sendJson(res, 400, { error: `format tidak dikenal: ${format} (pakai md|json|csv)` });
    return true;
  }

  return false;
}

function createServer() {
return http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('400 — permintaan tidak valid');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
    res.end('405 — metode tidak diizinkan');
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    try {
      if (!handleApi(req, res, url)) sendJson(res, 404, { error: 'endpoint tidak ditemukan' });
    } catch (error) {
      sendJson(res, 500, { error: 'terjadi kesalahan di server', detail: error.message });
    }
    return;
  }

  if (url.pathname === '/healthz') {
    sendJson(res, 200, { ok: true, uptime: Math.round(process.uptime()) });
    return;
  }

  serveStatic(req, res, url.pathname);
});
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    process.stdout.write(`Ide Codex berjalan di http://${HOST}:${PORT}\n`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { createServer };
