'use strict';

/* UI generator ide: semua data lewat API lokal (/api/...). */

const state = {
  category: '',
  difficulty: '',
  search: '',
  count: 2,
  meta: null,
  allIdeas: [],
  shown: [],
};

const $ = (sel) => document.querySelector(sel);
const resultsEl = $('#results');
const emptyState = $('#emptyState');
const toastEl = $('#toast');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer;
function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2400);
}

function buildQuery(extra = {}) {
  const params = new URLSearchParams();
  if (state.category) params.set('category', state.category);
  if (state.difficulty) params.set('difficulty', state.difficulty);
  if (state.search.trim()) params.set('search', state.search.trim());
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  }
  return params.toString();
}

function cardHtml(idea) {
  const mvp = idea.mvp.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const stack = idea.stack.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const features = idea.openaiFeatures.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const metrics = idea.metrics.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const risks = idea.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `
    <article class="card" data-id="${escapeHtml(idea.id)}">
      <div class="card-top">
        <div class="card-meta">
          <span class="tag tag-level">${escapeHtml(idea.difficulty)}</span>
          <span class="tag">${escapeHtml(idea.category)}</span>
          <span class="tag tag-lime">${escapeHtml(idea.timeframe)}</span>
        </div>
        <h2>${escapeHtml(idea.title)}</h2>
        <p class="card-tagline">${escapeHtml(idea.tagline)}</p>
      </div>
      <div class="card-body">
        <div class="block">
          <h3>Ringkasan</h3>
          <p>${escapeHtml(idea.summary)}</p>
        </div>
        <div class="block">
          <h3>Kenapa layak</h3>
          <p>${escapeHtml(idea.why)}</p>
        </div>
        <div class="block">
          <h3>Stack</h3>
          <ul class="stack-list">${stack}</ul>
        </div>
        <div class="block">
          <h3>Fitur OpenAI</h3>
          <ul class="stack-list">${features}</ul>
        </div>
        <div class="block">
          <h3>Cakupan MVP</h3>
          <ol class="checklist">${mvp}</ol>
        </div>
        <div class="block">
          <h3>Target terukur</h3>
          <ul class="metric-list">${metrics}</ul>
        </div>
        <div class="block">
          <h3>Risiko</h3>
          <ul class="risk-list">${risks}</ul>
        </div>
        <div class="block">
          <h3>Pengembangan lanjutan</h3>
          <ul class="risk-list">${idea.stretch.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>
        <details class="prompt">
          <summary>Prompt awal untuk Codex</summary>
          <pre>${escapeHtml(idea.prompt)}</pre>
        </details>
      </div>
      <div class="card-actions">
        <button class="btn btn-small" data-action="copy" data-id="${escapeHtml(idea.id)}">Salin brief</button>
        <a class="btn btn-small btn-ghost" href="/api/export?format=md&ids=${encodeURIComponent(idea.id)}">Unduh .md</a>
        <span class="spacer"></span>
        <button class="btn btn-small btn-ghost" data-action="similar" data-id="${escapeHtml(idea.id)}">Ide serupa</button>
      </div>
    </article>
  `;
}

function renderCards(ideas) {
  state.shown = ideas;
  if (!ideas.length) {
    resultsEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<p>Tidak ada ide yang cocok.</p><p class="muted">Coba longgarkan filter atau hapus kata kunci.</p>';
    resultsEl.appendChild(empty);
    return;
  }
  resultsEl.innerHTML = ideas.map(cardHtml).join('');
  resultsEl.setAttribute('aria-busy', 'false');
}

async function randomize() {
  resultsEl.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch(`/api/random?${buildQuery({ count: state.count })}`);
    const data = await res.json();
    if (!res.ok) {
      renderCards([]);
      toast(data.error || 'Gagal mengambil ide');
      return;
    }
    renderCards(data.ideas);
    $('#poolHint').innerHTML = `Menampilkan ${data.ideas.length} dari ${state.meta?.total ?? '—'} ide. Tekan <kbd>R</kbd> untuk mengacak lagi.`;
    const url = new URL(window.location.href);
    url.hash = 'acak';
    history.replaceState(null, '', url);
    document.querySelector('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    toast('Server tidak merespons. Coba muat ulang.');
  } finally {
    resultsEl.setAttribute('aria-busy', 'false');
  }
}

async function loadMeta() {
  const res = await fetch('/api/meta');
  const meta = await res.json();
  state.meta = meta;

  const chips = $('#categoryChips');
  const all = `<button type="button" class="chip is-active" data-category="">Semua <span class="chip-count">${meta.total}</span></button>`;
  chips.innerHTML = all + meta.categories.map((c) => (
    `<button type="button" class="chip" data-category="${escapeHtml(c.name)}">${escapeHtml(c.name)} <span class="chip-count">${c.count}</span></button>`
  )).join('');

  chips.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    state.category = chip.dataset.category || '';
    chips.querySelectorAll('.chip').forEach((el) => el.classList.toggle('is-active', el === chip));
    randomize();
  });

  const res2 = await fetch('/api/ideas');
  const data = await res2.json();
  state.allIdeas = data.ideas;
  renderExplorer(state.allIdeas);
  $('#explorerCount').textContent = `${state.allIdeas.length} ide siap dipakai`;
}

function renderExplorer(ideas) {
  $('#explorerBody').innerHTML = ideas.map((idea) => `
    <tr>
      <td>
        <a class="title-cell" href="#acak" data-action="open" data-id="${escapeHtml(idea.id)}">${escapeHtml(idea.title)}</a>
        <span class="sub">${escapeHtml(idea.tagline)}</span>
      </td>
      <td>${escapeHtml(idea.category)}</td>
      <td>${escapeHtml(idea.difficulty)}</td>
      <td>${escapeHtml(idea.timeframe)}</td>
      <td class="feats">${idea.openaiFeatures.slice(0, 3).map(escapeHtml).join(', ')}${idea.openaiFeatures.length > 3 ? ', …' : ''}</td>
    </tr>
  `).join('');
}

async function copyBrief(id) {
  const idea = state.allIdeas.find((i) => i.id === id) || state.shown.find((i) => i.id === id);
  if (!idea) return;
  const text = [
    `# ${idea.title}`,
    '',
    idea.tagline,
    '',
    `Kategori: ${idea.category} · Tingkat: ${idea.difficulty} · Estimasi: ${idea.timeframe}`,
    '',
    '## Ringkasan',
    idea.summary,
    '',
    '## Kenapa layak',
    idea.why,
    '',
    `## Stack\n${idea.stack.map((s) => `- ${s}`).join('\n')}`,
    '',
    `## Fitur OpenAI\n${idea.openaiFeatures.map((s) => `- ${s}`).join('\n')}`,
    '',
    `## MVP\n${idea.mvp.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    '',
    `## Target\n${idea.metrics.map((s) => `- [ ] ${s}`).join('\n')}`,
    '',
    `## Risiko\n${idea.risks.map((s) => `- ${s}`).join('\n')}`,
    '',
    `## Prompt awal\n${idea.prompt}`,
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    toast('Brief disalin ke clipboard');
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    toast(ok ? 'Brief disalin ke clipboard' : 'Clipboard diblokir browser');
  }
}

function connectSimilar(id) {
  const idea = state.allIdeas.find((i) => i.id === id);
  if (!idea) return;
  const similar = state.allIdeas
    .filter((other) => other.id !== idea.id)
    .map((other) => ({
      idea: other,
      score: other.category === idea.category ? 2 : 0
        + other.stack.filter((s) => idea.stack.includes(s)).length
        + other.openaiFeatures.filter((f) => idea.openaiFeatures.includes(f)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, state.count)
    .map((entry) => entry.idea);
  renderCards(similar);
  document.querySelector('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Menampilkan ide dengan kemiripan tertinggi');
}

function onResultsClick(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const { action, id } = trigger.dataset;
  if (action === 'copy') copyBrief(id);
  if (action === 'similar') connectSimilar(id);
  if (action === 'open') {
    event.preventDefault();
    const idea = state.allIdeas.find((i) => i.id === id);
    if (idea) {
      renderCards([idea]);
      document.querySelector('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function init() {
  if (emptyState) emptyState.remove();

  $('#controls').addEventListener('submit', (event) => {
    event.preventDefault();
    state.search = $('#search').value;
    state.difficulty = $('#difficulty').value;
    state.count = Number.parseInt($('#count').value, 10) || 1;
    randomize();
  });

  let searchTimer;
  $('#search').addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = event.target.value;
      randomize();
    }, 320);
  });

  $('#count').addEventListener('change', (event) => {
    state.count = Number.parseInt(event.target.value, 10) || 1;
  });

  document.addEventListener('click', onResultsClick);

  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      randomize();
    }
  });

  loadMeta()
    .then(() => randomize())
    .catch(() => toast('Gagal memuat data ide. Pastikan server berjalan.'));
}

init();
