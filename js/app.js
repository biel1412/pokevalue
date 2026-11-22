/* =========================================================
   PokéValue — app
   ========================================================= */
(() => {
  'use strict';

  // ---------- constantes ----------
  const TYPES = [
    { id: 'grass', name: 'Planta', e: '🌿', c: '#3DD17B', g: ['#7BE495', '#1F9E5A'] },
    { id: 'fire', name: 'Fogo', e: '🔥', c: '#FF7A3D', g: ['#FFB067', '#E8402B'] },
    { id: 'water', name: 'Água', e: '💧', c: '#3D9BFF', g: ['#7CC4FF', '#2463E0'] },
    { id: 'lightning', name: 'Elétrico', e: '⚡', c: '#FFCB05', g: ['#FFE873', '#F2A900'] },
    { id: 'psychic', name: 'Psíquico', e: '🔮', c: '#B56BFF', g: ['#D6A6FF', '#7A3BE0'] },
    { id: 'fighting', name: 'Lutador', e: '👊', c: '#E0703D', g: ['#F0A270', '#A8441F'] },
    { id: 'darkness', name: 'Sombrio', e: '🌑', c: '#5A6A8A', g: ['#6E7FA3', '#232B45'] },
    { id: 'metal', name: 'Metal', e: '⚙️', c: '#A7B4C8', g: ['#D6DEEA', '#6B7A92'] },
    { id: 'dragon', name: 'Dragão', e: '🐉', c: '#D4A93A', g: ['#E9C96B', '#7A5C12'] },
    { id: 'colorless', name: 'Incolor', e: '⭐', c: '#D9DCE8', g: ['#F2F3F8', '#A3A8BE'] },
    { id: 'trainer', name: 'Treinador', e: '🎒', c: '#FF5A8A', g: ['#FF9CBB', '#D12F63'] },
    { id: 'energy', name: 'Energia', e: '✨', c: '#2EE6D6', g: ['#8CF5EC', '#14A5B5'] },
  ];
  const TYPE = Object.fromEntries(TYPES.map((t) => [t.id, t]));
  const RARITIES = ['Comum', 'Incomum', 'Rara', 'Rara Holo', 'Rara Dupla (ex/V)', 'Ultra Rara', 'Ilustração Rara', 'Ilustração Especial Rara', 'Hiper Rara (Gold)', 'Secreta', 'Promo'];
  const HOLO_RARITIES = new Set(RARITIES.slice(3));
  const CONDITIONS = ['M', 'NM', 'SP', 'MP', 'HP', 'D'];
  const CONDITION_NAMES = { M: 'Mint', NM: 'Near Mint', SP: 'Pouco jogada', MP: 'Moderadamente jogada', HP: 'Muito jogada', D: 'Danificada' };
  const LANGS = ['Português', 'Inglês', 'Japonês', 'Outro'];

  // ---------- estado ----------
  const state = {
    cards: [],
    snapshots: [],
    trainer: '',
    hide: localStorage.getItem('pv_hide') === '1',
    range: localStorage.getItem('pv_range') || '1M',
    filter: 'all',
    sort: 'value',
    query: '',
    draft: null,
  };

  // ---------- utilidades ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const brlShort = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
  const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const money = (v) => (state.hide ? 'R$ •••••' : brl.format(v || 0));
  const moneyShort = (v) => (state.hide ? 'R$ •••' : (Math.abs(v) >= 10000 ? brlShort.format(v) : brl.format(v || 0)));
  const pct = (v) => (isFinite(v) ? (v > 0 ? '+' : '') + pctFmt.format(v) + '%' : '—');
  const dayKey = (d = new Date()) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };
  const fmtDate = (d, opts = { day: '2-digit', month: 'short' }) => new Date(d).toLocaleDateString('pt-BR', opts).replace('.', '');
  function parseMoney(str) {
    if (typeof str === 'number') return str;
    let s = String(str || '').replace(/[^\d.,]/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    const n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  const moneyInput = (v) => (v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');

  const ICON = {
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.8A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    trend: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
    cards: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="11" rx="1.5"/><rect x="13" y="4" width="8" height="11" rx="1.5"/><path d="M5 19h14"/></svg>',
    pie: '<svg viewBox="0 0 24 24"><path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 21V9M7 14l5-5 5 5M4 3h16"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/></svg>',
    up: '<svg viewBox="0 0 12 12"><path d="M6 2l4.5 6h-9z"/></svg>',
    down: '<svg viewBox="0 0 12 12"><path d="M6 10L1.5 4h9z"/></svg>',
  };

  // ---------- cálculos ----------
  const cardTotal = (c) => (c.value || 0) * (c.qty || 1);
  const cardPaid = (c) => (c.paid || 0) * (c.qty || 1);
  function totals(cards = state.cards) {
    let value = 0, paid = 0, count = 0;
    cards.forEach((c) => { value += cardTotal(c); paid += cardPaid(c); count += c.qty || 1; });
    return { value, paid, count, unique: cards.length, profit: value - paid, profitPct: paid ? ((value - paid) / paid) * 100 : NaN };
  }

  async function recordSnapshot() {
    const t = totals();
    const snap = { date: dayKey(), total: t.value, invested: t.paid, ts: Date.now() };
    await DB.put('snapshots', snap);
    const i = state.snapshots.findIndex((s) => s.date === snap.date);
    if (i >= 0) state.snapshots[i] = snap; else state.snapshots.push(snap);
    state.snapshots.sort((a, b) => a.date.localeCompare(b.date));
  }

  const RANGES = { '7D': 7, '1M': 30, '3M': 90, '1A': 365, 'Tudo': Infinity };
  function seriesFor(range) {
    const days = RANGES[range];
    const snaps = state.snapshots;
    const now = totals().value;
    if (!snaps.length) return [{ t: Date.now(), v: now }];
    const start = days === Infinity ? -Infinity : Date.now() - days * 864e5;
    const toTs = (s) => new Date(s.date + 'T12:00:00').getTime();
    let pts = snaps.filter((s) => toTs(s) >= start).map((s) => ({ t: toTs(s), v: s.total }));
    const before = snaps.filter((s) => toTs(s) < start).pop();
    if (before) pts.unshift({ t: start, v: before.total });
    if (!pts.length) pts = [{ t: start === -Infinity ? Date.now() : start, v: now }];
    const last = pts[pts.length - 1];
    if (last.v !== now || pts.length === 1) pts.push({ t: Date.now(), v: now });
    return pts;
  }

  // ---------- componentes ----------
  function art(card, { holo = true } = {}) {
    const t = TYPE[card.type] || TYPE.colorless;
    const isHolo = holo && HOLO_RARITIES.has(card.rarity);
    if (card.image) {
      return `<div class="art ${isHolo ? 'holo' : ''}"><img src="${card.image}" alt="${esc(card.name)}" loading="lazy" /></div>`;
    }
    return `<div class="art ${isHolo ? 'holo' : ''}" style="background:linear-gradient(160deg, ${t.g[0]}, ${t.g[1]})">
      <div class="ph"><div class="ph-emoji">${t.e}</div><div class="ph-name">${esc(card.name)}</div></div></div>`;
  }

  function changePill(diff, base) {
    const p = base ? (diff / base) * 100 : 0;
    const cls = Math.abs(diff) < 0.005 ? 'flat' : diff > 0 ? 'up' : 'down';
    const ico = cls === 'up' ? ICON.up : cls === 'down' ? ICON.down : '';
    const val = state.hide ? '•••' : (diff >= 0 ? '+' : '−') + brl.format(Math.abs(diff)).replace('R$', 'R$');
    return `<span class="pill ${cls}">${ico}${val}${base ? ` (${pct(p)})` : ''}</span>`;
  }

  function splitMoney(v) {
    if (state.hide) return `R$ •••••`;
    const s = brl.format(v);
    const i = s.lastIndexOf(',');
    return i > 0 ? `${s.slice(0, i)}<span class="cents">${s.slice(i)}</span>` : s;
  }

  function lineChart(points, { height = 170, color = '#FFCB05', id = 'c' } = {}) {
    const W = 340, H = height, padT = 26, padB = 14;
    const vs = points.map((p) => p.v);
    let min = Math.min(...vs), max = Math.max(...vs);
    if (max === min) { max += max * 0.1 || 1; min -= min * 0.1 || 1; }
    const t0 = points[0].t, t1 = points[points.length - 1].t || t0 + 1;
    const x = (t) => (t1 === t0 ? W : ((t - t0) / (t1 - t0)) * W);
    const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
    const xy = points.map((p) => [x(p.t), y(p.v)]);
    if (xy.length === 1) xy.unshift([0, xy[0][1]]);
    let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
    for (let i = 1; i < xy.length; i++) {
      const [px, py] = xy[i - 1], [cx, cy] = xy[i];
      const mx = (px + cx) / 2;
      d += ` C${mx.toFixed(1)},${py.toFixed(1)} ${mx.toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`;
    }
    const last = xy[xy.length - 1];
    const area = `${d} L${last[0].toFixed(1)},${H} L${xy[0][0].toFixed(1)},${H} Z`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-chart="${id}">
      <defs>
        <linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity=".35"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${padT + f * (H - padT - padB)}" y2="${padT + f * (H - padT - padB)}" stroke="rgba(255,255,255,.05)" stroke-dasharray="3 5"/>`).join('')}
      <path d="${area}" fill="url(#g-${id})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <line class="cursor" x1="0" x2="0" y1="${padT - 10}" y2="${H}" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 3" style="display:none"/>
      <circle class="pulse" cx="${last[0]}" cy="${last[1]}" r="5" fill="${color}"/>
      <circle class="dot" cx="${last[0]}" cy="${last[1]}" r="5" fill="${color}" stroke="#0A0D1A" stroke-width="2.5"/>
    </svg>`;
  }

  function bindChart(wrap, points, onMove) {
    const svg = $('svg', wrap); if (!svg) return;
    const tip = $('.chart-tip', wrap), cursor = $('.cursor', svg), dot = $('.dot', svg);
    const W = 340, H = svg.viewBox.baseVal.height, padT = 26, padB = 14;
    const vs = points.map((p) => p.v);
    let min = Math.min(...vs), max = Math.max(...vs);
    if (max === min) { max += max * 0.1 || 1; min -= min * 0.1 || 1; }
    const t0 = points[0].t, t1 = points[points.length - 1].t;
    const restore = { cx: dot.getAttribute('cx'), cy: dot.getAttribute('cy') };
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const target = t0 + fx * (t1 - t0);
      let best = points[0];
      points.forEach((p) => { if (Math.abs(p.t - target) < Math.abs(best.t - target)) best = p; });
      const px = t1 === t0 ? W : ((best.t - t0) / (t1 - t0)) * W;
      const py = padT + (1 - (best.v - min) / (max - min)) * (H - padT - padB);
      cursor.style.display = ''; cursor.setAttribute('x1', px); cursor.setAttribute('x2', px);
      dot.setAttribute('cx', px); dot.setAttribute('cy', py);
      tip.innerHTML = `<b>${money(best.v)}</b><span>${fmtDate(best.t, { day: '2-digit', month: 'short', year: '2-digit' })}</span>`;
      tip.style.left = Math.min(r.width - 50, Math.max(50, (px / W) * r.width)) + 'px';
      tip.classList.add('show');
      onMove && onMove(best);
    };
    const end = () => {
      cursor.style.display = 'none'; tip.classList.remove('show');
      dot.setAttribute('cx', restore.cx); dot.setAttribute('cy', restore.cy);
      onMove && onMove(null);
    };
    wrap.addEventListener('pointerdown', (e) => { move(e); });
    wrap.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons || e.pressure) move(e); });
    wrap.addEventListener('pointerup', end);
    wrap.addEventListener('pointerleave', end);
    wrap.addEventListener('pointercancel', end);
  }

  // ---------- UI helpers ----------
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function sheet(html, onMount) {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet"><div class="grab"></div>${html}</div>`;
    const close = () => { root.innerHTML = ''; };
    $('.sheet-backdrop', root).onclick = close;
    onMount && onMount($('.sheet', root), close);
    return close;
  }

  function confirmSheet({ title, text, ok = 'Confirmar', danger = false }) {
    return new Promise((resolve) => {
      sheet(`<h3>${esc(title)}</h3><p>${esc(text)}</p>
        <button class="btn btn-block ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(ok)}</button>
        <button class="btn btn-block btn-ghost" data-cancel>Cancelar</button>`, (el, close) => {
        $('[data-ok]', el).onclick = () => { close(); resolve(true); };
        $('[data-cancel]', el).onclick = () => { close(); resolve(false); };
        $('.sheet-backdrop').onclick = () => { close(); resolve(false); };
      });
    });
  }

  function burst() {
    const colors = ['#FFCB05', '#FF4D6A', '#3D7DFF', '#2EE6A6', '#B56BFF'];
    const el = document.createElement('div'); el.className = 'burst';
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220;
      const s = document.createElement('i');
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--x', Math.cos(a) * r + 'px');
      s.style.setProperty('--y', Math.sin(a) * r + 120 + 'px');
      s.style.setProperty('--r', Math.random() * 720 + 'deg');
      s.style.animationDelay = Math.random() * 0.1 + 's';
      el.appendChild(s);
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  const initials = (n) => (n || 'T').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }

  // =========================================================
  // TELAS
  // =========================================================

  // ---------- Início / dashboard ----------
  function viewHome() {
    const t = totals();
    const pts = seriesFor(state.range);
    const startV = pts[0].v, endV = t.value;
    const rangeLabel = { '7D': 'nos últimos 7 dias', '1M': 'no último mês', '3M': 'nos últimos 3 meses', '1A': 'no último ano', 'Tudo': 'desde o início' }[state.range];
    const top = [...state.cards].sort((a, b) => cardTotal(b) - cardTotal(a)).slice(0, 8);
    const recent = [...state.cards].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    const byType = groupBy(state.cards, (c) => c.type || 'colorless');
    const typeRows = Object.entries(byType).map(([k, list]) => ({ t: TYPE[k] || TYPE.colorless, v: list.reduce((s, c) => s + cardTotal(c), 0) }))
      .filter((r) => r.v > 0).sort((a, b) => b.v - a.v);

    return `
      <header class="topbar">
        <div class="who">
          <a href="#/ajustes" class="avatar">${esc(initials(state.trainer))}</a>
          <div class="hello"><small>${greeting()},</small><strong>${esc(state.trainer || 'Treinador(a)')}</strong></div>
        </div>
        <button class="icon-btn ${state.hide ? 'on' : ''}" id="toggle-hide" aria-label="Ocultar valores">${state.hide ? ICON.eyeOff : ICON.eye}</button>
      </header>

      <section class="balance">
        <div class="balance-head">
          <div class="balance-label">Patrimônio em cartas</div>
          <div class="chip-gold"></div>
        </div>
        <div class="balance-value num" id="bal-value">${splitMoney(endV)}</div>
        <div class="balance-change" id="bal-change">${changePill(endV - startV, startV)} <span class="period">${rangeLabel}</span></div>
        <div class="balance-grid">
          <div><small>Investido</small><strong class="num">${moneyShort(t.paid)}</strong></div>
          <div><small>Lucro</small><strong class="num ${t.profit >= 0 ? 'up-t' : 'down-t'}">${state.hide ? '•••' : (t.paid ? pct(t.profitPct) : '—')}</strong></div>
          <div><small>Cartas</small><strong class="num">${t.count}</strong></div>
        </div>
      </section>

      <section class="section panel" style="padding-bottom:12px">
        <div class="chart-wrap" id="home-chart">${lineChart(pts, { id: 'home' })}<div class="chart-tip"></div></div>
        <div class="ranges">${Object.keys(RANGES).map((r) => `<button data-range="${r}" class="${r === state.range ? 'active' : ''}">${r}</button>`).join('')}</div>
      </section>

      <nav class="quick">
        <a href="#/nova"><span class="q-ico q-yellow">${ICON.camera}</span>Escanear</a>
        <a href="#/colecao"><span class="q-ico q-blue">${ICON.cards}</span>Coleção</a>
        <a href="#/analise"><span class="q-ico q-green">${ICON.pie}</span>Análise</a>
        <a href="#/colecao?sort=profit"><span class="q-ico q-purple">${ICON.trend}</span>Valorização</a>
      </nav>

      ${state.cards.length === 0 ? emptyState() : `
      <section class="section">
        <div class="section-head"><h2>💎 Suas joias</h2><a href="#/colecao">Ver todas</a></div>
        <div class="hscroll">
          ${top.map((c, i) => `<a class="gem" href="#/carta/${c.id}"><div style="position:relative"><span class="rank">#${i + 1}</span>${art(c)}</div>
            <h4>${esc(c.name)}</h4><p class="num">${moneyShort(cardTotal(c))}</p></a>`).join('')}
        </div>
      </section>

      <section class="section panel">
        <div class="section-head"><h2>Alocação por tipo</h2><a href="#/analise">Detalhes</a></div>
        <div class="alloc-bar">${typeRows.map((r) => `<span style="flex:${r.v};background:${r.t.c}"></span>`).join('') || '<span style="flex:1;background:var(--surface-2)"></span>'}</div>
        <div class="legend">${typeRows.slice(0, 6).map((r) => `<div><i style="background:${r.t.c}"></i><span>${r.t.e} ${r.t.name}</span><b>${pctFmt.format((r.v / (t.value || 1)) * 100)}%</b></div>`).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Adicionadas recentemente</h2></div>
        <div class="list">${recent.map(rowItem).join('')}</div>
      </section>`}
    `;
  }

  function rowItem(c) {
    const diff = cardTotal(c) - cardPaid(c);
    const p = cardPaid(c) ? (diff / cardPaid(c)) * 100 : NaN;
    return `<a class="row" href="#/carta/${c.id}">${art(c, { holo: false })}
      <div class="meta"><strong>${esc(c.name)}</strong><small>${esc([c.set, c.number && '#' + c.number].filter(Boolean).join(' · ') || (TYPE[c.type] || TYPE.colorless).name)}${c.qty > 1 ? ` · ${c.qty}x` : ''}</small></div>
      <div class="val"><strong class="num">${money(cardTotal(c))}</strong>${c.paid ? `<small class="${diff >= 0 ? 'up-t' : 'down-t'}">${state.hide ? '' : pct(p)}</small>` : '<small class="muted">—</small>'}</div></a>`;
  }

  function emptyState() {
    return `<div class="empty">
      <div class="stack"><span></span><span></span><span>📸</span></div>
      <h3>Sua coleção começa aqui</h3>
      <p>Tire uma foto da sua primeira carta, informe o valor de mercado e acompanhe seu patrimônio crescer.</p>
      <a class="btn btn-primary" href="#/nova">${ICON.camera} Escanear primeira carta</a>
      <div style="margin-top:12px"><button class="btn btn-ghost" id="load-demo" style="height:44px;font-size:14px">${ICON.spark} Ver com cartas de exemplo</button></div>
    </div>`;
  }

  function bindHome() {
    $('#toggle-hide').onclick = () => { state.hide = !state.hide; localStorage.setItem('pv_hide', state.hide ? '1' : '0'); render(); };
    $$('[data-range]').forEach((b) => b.onclick = () => { state.range = b.dataset.range; localStorage.setItem('pv_range', state.range); render(true); });
    const demo = $('#load-demo'); if (demo) demo.onclick = loadDemo;
    const pts = seriesFor(state.range);
    const startV = pts[0].v;
    const rangeLabel = $('#bal-change .period')?.textContent;
    bindChart($('#home-chart'), pts, (p) => {
      if (p) {
        $('#bal-value').innerHTML = splitMoney(p.v);
        $('#bal-change').innerHTML = `${changePill(p.v - startV, startV)} <span class="period">em ${fmtDate(p.t, { day: '2-digit', month: 'short' })}</span>`;
      } else {
        const v = totals().value;
        $('#bal-value').innerHTML = splitMoney(v);
        $('#bal-change').innerHTML = `${changePill(v - startV, startV)} <span class="period">${rangeLabel}</span>`;
      }
    });
  }

  // ---------- Coleção ----------
  function filteredCards() {
    const q = state.query.trim().toLowerCase();
    let list = state.cards.filter((c) => (state.filter === 'all' || (state.filter === 'fav' ? c.favorite : c.type === state.filter)));
    if (q) list = list.filter((c) => [c.name, c.set, c.number, c.rarity].join(' ').toLowerCase().includes(q));
    const by = {
      value: (a, b) => cardTotal(b) - cardTotal(a),
      recent: (a, b) => b.createdAt - a.createdAt,
      name: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
      profit: (a, b) => (cardTotal(b) - cardPaid(b)) - (cardTotal(a) - cardPaid(a)),
    }[state.sort];
    return list.sort(by);
  }

  function viewCollection(params) {
    if (params.get('sort')) state.sort = params.get('sort');
    const usedTypes = TYPES.filter((t) => state.cards.some((c) => c.type === t.id));
    const t = totals();
    return `
      <header class="topbar">
        <div><h1 class="page-title">Coleção</h1><div class="page-sub">${t.unique} ${t.unique === 1 ? 'carta' : 'cartas'} · <span class="num">${money(t.value)}</span></div></div>
        <a class="icon-btn" href="#/nova" aria-label="Nova carta" style="color:var(--yellow)"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></a>
      </header>
      <label class="search">${ICON.search}<input id="q" type="search" placeholder="Buscar por nome, coleção, número…" value="${esc(state.query)}" autocomplete="off" /></label>
      <div class="chips">
        <button class="chip ${state.filter === 'all' ? 'active' : ''}" data-filter="all">Todas</button>
        <button class="chip ${state.filter === 'fav' ? 'active' : ''}" data-filter="fav">⭐ Favoritas</button>
        ${usedTypes.map((ty) => `<button class="chip ${state.filter === ty.id ? 'active' : ''}" data-filter="${ty.id}">${ty.e} ${ty.name}</button>`).join('')}
      </div>
      <div class="toolbar"><span id="count"></span>
        <select id="sort">
          <option value="value" ${state.sort === 'value' ? 'selected' : ''}>Maior valor</option>
          <option value="profit" ${state.sort === 'profit' ? 'selected' : ''}>Maior valorização</option>
          <option value="recent" ${state.sort === 'recent' ? 'selected' : ''}>Mais recentes</option>
          <option value="name" ${state.sort === 'name' ? 'selected' : ''}>Nome (A–Z)</option>
        </select>
      </div>
      <div id="grid"></div>`;
  }

  function renderGrid() {
    const list = filteredCards();
    $('#count').textContent = `${list.length} resultado${list.length === 1 ? '' : 's'}`;
    if (!state.cards.length) { $('#grid').innerHTML = emptyState(); const d = $('#load-demo'); if (d) d.onclick = loadDemo; return; }
    if (!list.length) { $('#grid').innerHTML = `<div class="empty"><h3>Nada encontrado</h3><p>Tente outro termo ou filtro.</p></div>`; return; }
    $('#grid').innerHTML = `<div class="grid">${list.map((c, i) => {
      const diff = cardTotal(c) - cardPaid(c);
      const p = cardPaid(c) ? (diff / cardPaid(c)) * 100 : NaN;
      return `<a class="tile" href="#/carta/${c.id}" style="animation-delay:${Math.min(i, 12) * 35}ms">
        <div style="position:relative">${c.favorite ? '<span class="fav">⭐</span>' : ''}${c.qty > 1 ? `<span class="qty">${c.qty}x</span>` : ''}${art(c)}</div>
        <h4>${esc(c.name)}</h4>
        <div class="sub">${esc([c.set, c.number && '#' + c.number].filter(Boolean).join(' · ') || c.rarity || '')}</div>
        <div class="price"><strong class="num">${moneyShort(cardTotal(c))}</strong>${c.paid && !state.hide ? `<small class="${diff >= 0 ? 'up-t' : 'down-t'}">${pct(p)}</small>` : ''}</div>
      </a>`;
    }).join('')}</div>`;
  }

  function bindCollection() {
    renderGrid();
    $('#q').oninput = (e) => { state.query = e.target.value; renderGrid(); };
    $('#sort').onchange = (e) => { state.sort = e.target.value; renderGrid(); };
    $$('[data-filter]').forEach((b) => b.onclick = () => {
      state.filter = b.dataset.filter;
      $$('[data-filter]').forEach((x) => x.classList.toggle('active', x === b));
      renderGrid();
    });
  }

  // ---------- Cadastro / edição ----------
  function newDraft() {
    return { id: null, name: '', set: '', number: '', type: 'fire', rarity: 'Rara', condition: 'NM', language: 'Português', qty: 1, paid: 0, value: 0, image: null, notes: '', favorite: false };
  }

  function viewForm(id) {
    const editing = !!id;
    if (!state.draft || state.draft._for !== (id || 'new')) {
      const base = editing ? state.cards.find((c) => c.id === id) : null;
      if (editing && !base) return notFound();
      state.draft = { ...(base ? structuredClone(base) : newDraft()), _for: id || 'new' };
    }
    const d = state.draft;
    return `
      <div class="form-head">
        <a class="icon-btn" href="${editing ? '#/carta/' + id : '#/'}" data-cancel aria-label="Voltar">${ICON.back}</a>
        <h1>${editing ? 'Editar carta' : 'Nova carta'}</h1>
      </div>

      <div class="photo-slot ${d.image ? 'has' : ''}" id="photo-slot">
        ${d.image ? `<img src="${d.image}" alt="Foto da carta" />` : `
          <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
          <span class="scan-line"></span>
          <div class="cam-ico">${ICON.camera}</div>
          <strong>Fotografar carta</strong>
          <small>Enquadre a carta inteira,<br/>em boa luz e sem reflexo</small>`}
      </div>
      <div class="photo-actions">
        <button class="btn btn-ghost" id="btn-cam">${ICON.camera} Câmera</button>
        <button class="btn btn-ghost" id="btn-gal">${ICON.image} Galeria</button>
      </div>

      <form id="card-form" autocomplete="off">
        <div class="field"><label for="f-name">Nome da carta</label>
          <input class="input" id="f-name" name="name" placeholder="Ex.: Charizard ex" value="${esc(d.name)}" required /></div>

        <div class="two">
          <div class="field"><label for="f-set">Coleção</label>
            <input class="input" id="f-set" name="set" placeholder="Ex.: Obsidian Flames" value="${esc(d.set)}" /></div>
          <div class="field"><label for="f-number">Número</label>
            <input class="input" id="f-number" name="number" placeholder="Ex.: 125/197" value="${esc(d.number)}" /></div>
        </div>

        <div class="field"><label>Valor de mercado (unidade)</label>
          <div class="money big"><span>R$</span><input class="input num" id="f-value" name="value" inputmode="decimal" placeholder="0,00" value="${moneyInput(d.value)}" /></div>
          <div class="price-links" id="price-links"></div>
        </div>

        <div class="two">
          <div class="field"><label>Preço pago (un.)</label>
            <div class="money"><span>R$</span><input class="input num" id="f-paid" name="paid" inputmode="decimal" placeholder="0,00" value="${moneyInput(d.paid)}" /></div></div>
          <div class="field"><label>Quantidade</label>
            <div class="stepper"><button type="button" data-step="-1">−</button><input id="f-qty" name="qty" inputmode="numeric" value="${d.qty}" /><button type="button" data-step="1">+</button></div></div>
        </div>
        <div class="profit-preview" id="profit-preview"></div>

        <div class="field"><label>Tipo</label>
          <div class="type-grid">${TYPES.map((t) => `<button type="button" class="type-opt ${d.type === t.id ? 'active' : ''}" style="--tc:${t.c}" data-type="${t.id}"><span class="e">${t.e}</span>${t.name}</button>`).join('')}</div></div>

        <div class="field"><label for="f-rarity">Raridade</label>
          <select class="input" id="f-rarity" name="rarity">${RARITIES.map((r) => `<option ${d.rarity === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>

        <div class="field"><label>Condição</label>
          <div class="seg" id="cond">${CONDITIONS.map((c) => `<button type="button" data-cond="${c}" class="${d.condition === c ? 'active' : ''}" title="${CONDITION_NAMES[c]}">${c}</button>`).join('')}</div>
          <div class="hint" id="cond-hint">${CONDITION_NAMES[d.condition]}</div></div>

        <div class="field"><label>Idioma</label>
          <div class="seg" id="lang">${LANGS.map((l) => `<button type="button" data-lang="${l}" class="${d.language === l ? 'active' : ''}">${l}</button>`).join('')}</div></div>

        <div class="field"><label for="f-notes">Observações</label>
          <textarea class="input" id="f-notes" name="notes" placeholder="Graduação, onde comprou, detalhes…">${esc(d.notes)}</textarea></div>

        <div class="save-bar"><button class="btn btn-primary btn-block" type="submit">${editing ? 'Salvar alterações' : 'Adicionar ao inventário'}</button></div>
      </form>`;
  }

  function priceLinks(name, number) {
    if (!name.trim()) return '<span class="hint" style="margin:0">Digite o nome para pesquisar o preço de mercado.</span>';
    const q = encodeURIComponent([name, number].filter(Boolean).join(' '));
    return `
      <a href="https://www.ligapokemon.com.br/?view=cards/search&card=${encodeURIComponent(name)}" target="_blank" rel="noopener">${ICON.ext} Liga Pokémon</a>
      <a href="https://www.tcgplayer.com/search/pokemon/product?q=${q}" target="_blank" rel="noopener">${ICON.ext} TCGplayer</a>
      <a href="https://www.cardmarket.com/pt/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}" target="_blank" rel="noopener">${ICON.ext} Cardmarket</a>`;
  }

  function bindForm(id) {
    const d = state.draft;
    const form = $('#card-form');
    const sync = () => {
      d.name = $('#f-name').value; d.set = $('#f-set').value; d.number = $('#f-number').value;
      d.value = parseMoney($('#f-value').value); d.paid = parseMoney($('#f-paid').value);
      d.qty = Math.max(1, parseInt($('#f-qty').value, 10) || 1);
      d.rarity = $('#f-rarity').value; d.notes = $('#f-notes').value;
    };
    const updatePreview = () => {
      sync();
      $('#price-links').innerHTML = priceLinks(d.name, d.number);
      const total = d.value * d.qty, paid = d.paid * d.qty, diff = total - paid;
      $('#profit-preview').innerHTML = `<span class="muted">Total na carteira</span><span><b class="num">${brl.format(total)}</b>${paid ? ` <small class="${diff >= 0 ? 'up-t' : 'down-t'}">${pct((diff / paid) * 100)}</small>` : ''}</span>`;
    };
    form.addEventListener('input', updatePreview);
    updatePreview();

    $$('[data-type]').forEach((b) => b.onclick = () => { d.type = b.dataset.type; $$('[data-type]').forEach((x) => x.classList.toggle('active', x === b)); });
    $$('[data-cond]').forEach((b) => b.onclick = () => { d.condition = b.dataset.cond; $$('[data-cond]').forEach((x) => x.classList.toggle('active', x === b)); $('#cond-hint').textContent = CONDITION_NAMES[d.condition]; });
    $$('[data-lang]').forEach((b) => b.onclick = () => { d.language = b.dataset.lang; $$('[data-lang]').forEach((x) => x.classList.toggle('active', x === b)); });
    $$('[data-step]').forEach((b) => b.onclick = () => { $('#f-qty').value = Math.max(1, (parseInt($('#f-qty').value, 10) || 1) + +b.dataset.step); updatePreview(); });
    ['#f-value', '#f-paid'].forEach((s) => $(s).addEventListener('blur', (e) => { const v = parseMoney(e.target.value); e.target.value = moneyInput(v); }));

    const pick = (inputId) => { sync(); const inp = $(inputId); inp.value = ''; inp.click(); };
    $('#btn-cam').onclick = () => pick('#file-camera');
    $('#btn-gal').onclick = () => pick('#file-gallery');
    $('#photo-slot').onclick = () => pick('#file-camera');
    $$('[data-cancel]').forEach((a) => a.addEventListener('click', () => { state.draft = null; }));

    form.onsubmit = async (e) => {
      e.preventDefault(); sync();
      if (!d.name.trim()) { toast('Dê um nome para a carta'); $('#f-name').focus(); return; }
      const now = Date.now();
      const existing = id ? state.cards.find((c) => c.id === id) : null;
      const card = { ...d };
      delete card._for;
      card.name = card.name.trim();
      if (existing) {
        card.updatedAt = now;
        card.priceHistory = [...(existing.priceHistory || [])];
        if (existing.value !== card.value) card.priceHistory.push({ d: now, v: card.value });
        Object.assign(existing, card);
        await DB.put('cards', existing);
      } else {
        card.id = uid(); card.createdAt = now; card.updatedAt = now;
        card.priceHistory = [{ d: now, v: card.value }];
        state.cards.push(card);
        await DB.put('cards', card);
      }
      await recordSnapshot();
      state.draft = null;
      if (!existing) burst();
      toast(existing ? 'Carta atualizada ✓' : `${card.name} adicionada ao inventário!`);
      location.hash = '#/carta/' + (existing ? existing.id : card.id);
    };
  }

  async function handleImage(file) {
    if (!file || !state.draft) return;
    try {
      state.draft.image = await compressImage(file, 900, 0.82);
      render();
    } catch (err) {
      console.error(err); toast('Não foi possível ler a imagem');
    }
  }

  function compressImage(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', quality));
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  // ---------- Detalhe ----------
  function viewDetail(id) {
    const c = state.cards.find((x) => x.id === id);
    if (!c) return notFound();
    const t = TYPE[c.type] || TYPE.colorless;
    const total = cardTotal(c), paid = cardPaid(c), diff = total - paid;
    const hist = (c.priceHistory || []).map((h) => ({ t: h.d, v: h.v }));
    const firstV = hist.length ? hist[0].v : c.value;
    return `
      <div class="detail-top">
        <a class="icon-btn" href="#/colecao" aria-label="Voltar">${ICON.back}</a>
        <div class="r">
          <button class="icon-btn ${c.favorite ? 'on' : ''}" id="fav" aria-label="Favoritar">${ICON.star}</button>
          <a class="icon-btn" href="#/editar/${c.id}" aria-label="Editar">${ICON.edit}</a>
        </div>
      </div>

      <div class="showcase" style="--glow:${t.c}">
        <div class="tilt" id="tilt"><div style="position:relative">${art(c)}<div class="glare"></div></div></div>
      </div>

      <div class="detail-name">
        <h1>${esc(c.name)}</h1>
        <p>${esc([c.set, c.number && '#' + c.number].filter(Boolean).join(' · ') || 'Sem coleção informada')}</p>
        <div class="tags">
          <span class="tag" style="background:${t.c}33">${t.e} ${t.name}</span>
          ${c.rarity ? `<span class="tag">${esc(c.rarity)}</span>` : ''}
          <span class="tag" title="${CONDITION_NAMES[c.condition] || ''}">${esc(c.condition)}</span>
          <span class="tag">${esc(c.language)}</span>
        </div>
      </div>

      <section class="panel value-card">
        <div class="big">
          <div><small>Valor total${c.qty > 1 ? ` · ${c.qty} unidades` : ''}</small><strong class="num">${money(total)}</strong></div>
          ${paid ? changePill(diff, paid) : ''}
        </div>
        ${hist.length > 1 ? `<div class="chart-wrap" id="card-chart" style="margin-top:8px">${lineChart(hist, { id: 'card', height: 120, color: diff >= 0 ? '#2EE6A6' : '#FF4D6A' })}<div class="chart-tip"></div></div>` : ''}
        <div class="stats">
          <div class="stat"><small>Mercado (un.)</small><strong class="num">${money(c.value)}</strong></div>
          <div class="stat"><small>Pago (un.)</small><strong class="num">${c.paid ? money(c.paid) : '—'}</strong></div>
          <div class="stat"><small>Lucro / prejuízo</small><strong class="num ${diff >= 0 ? 'up-t' : 'down-t'}">${paid ? money(diff) : '—'}</strong></div>
          <div class="stat"><small>Desde o cadastro</small><strong class="num ${c.value >= firstV ? 'up-t' : 'down-t'}">${firstV ? pct(((c.value - firstV) / firstV) * 100) : '—'}</strong></div>
        </div>
        <button class="btn btn-primary btn-block" id="update-value" style="margin-top:14px">${ICON.refresh} Atualizar valor de mercado</button>
        <div class="price-links" style="justify-content:center">${priceLinks(c.name, c.number)}</div>
      </section>

      ${c.notes ? `<section class="section"><div class="section-head"><h2>Observações</h2></div><div class="panel notes">${esc(c.notes)}</div></section>` : ''}

      ${hist.length ? `<section class="section"><div class="section-head"><h2>Histórico de preço</h2></div>
        <div class="panel history-list list">${[...hist].reverse().slice(0, 10).map((h, i, arr) => {
          const prev = arr[i + 1]; const dd = prev ? h.v - prev.v : 0;
          return `<div class="row"><div class="meta"><strong>${fmtDate(h.t, { day: '2-digit', month: 'long', year: 'numeric' })}</strong><small>${prev ? 'Atualização de valor' : 'Cadastro'}</small></div>
            <div class="val"><strong class="num">${money(h.v)}</strong>${prev ? `<small class="${dd >= 0 ? 'up-t' : 'down-t'}">${pct((dd / (prev.v || 1)) * 100)}</small>` : ''}</div></div>`;
        }).join('')}</div></section>` : ''}

      <section class="section">
        <button class="btn btn-danger btn-block" id="delete">${ICON.trash} Remover do inventário</button>
        <p class="about">Cadastrada em ${fmtDate(c.createdAt, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </section>`;
  }

  function bindDetail(id) {
    const c = state.cards.find((x) => x.id === id);
    if (!c) return;
    const hist = (c.priceHistory || []).map((h) => ({ t: h.d, v: h.v }));
    if (hist.length > 1) bindChart($('#card-chart'), hist);

    // efeito 3D na carta
    const tilt = $('#tilt');
    const glare = $('.glare', tilt);
    const moveTilt = (e) => {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tilt.style.transform = `rotateY(${(px - 0.5) * 22}deg) rotateX(${(0.5 - py) * 22}deg) scale(1.03)`;
      glare.style.setProperty('--gx', px * 100 + '%'); glare.style.setProperty('--gy', py * 100 + '%');
    };
    tilt.addEventListener('pointermove', moveTilt);
    tilt.addEventListener('pointerdown', moveTilt);
    const reset = () => { tilt.style.transform = ''; };
    tilt.addEventListener('pointerleave', reset); tilt.addEventListener('pointerup', reset); tilt.addEventListener('pointercancel', reset);
    tilt.style.touchAction = 'none';
    tilt.onclick = () => { if (c.image) openImage(c.image); };

    $('#fav').onclick = async () => {
      c.favorite = !c.favorite; await DB.put('cards', c);
      $('#fav').classList.toggle('on', c.favorite);
      toast(c.favorite ? 'Adicionada às favoritas ⭐' : 'Removida das favoritas');
    };

    $('#update-value').onclick = () => {
      sheet(`<h3>Atualizar valor</h3><p>Informe o valor de mercado atual de <b>${esc(c.name)}</b> (por unidade). Isso entra no histórico e no seu patrimônio.</p>
        <div class="money big"><span>R$</span><input class="input num" id="nv" inputmode="decimal" value="${moneyInput(c.value)}" /></div>
        <div class="price-links">${priceLinks(c.name, c.number)}</div>
        <button class="btn btn-primary btn-block" id="nv-save">Salvar novo valor</button>`, (el, close) => {
        const inp = $('#nv', el); setTimeout(() => { inp.focus(); inp.select(); }, 250);
        $('#nv-save', el).onclick = async () => {
          const v = parseMoney(inp.value);
          if (v !== c.value) {
            const old = c.value;
            c.value = v; c.updatedAt = Date.now();
            c.priceHistory = [...(c.priceHistory || []), { d: Date.now(), v }];
            await DB.put('cards', c); await recordSnapshot();
            toast(v > old ? `📈 Valorizou ${pct(((v - old) / (old || 1)) * 100)}!` : 'Valor atualizado');
          }
          close(); render();
        };
      });
    };

    $('#delete').onclick = async () => {
      const ok = await confirmSheet({ title: 'Remover carta?', text: `${c.name} será removida do inventário. Essa ação não pode ser desfeita.`, ok: 'Remover', danger: true });
      if (!ok) return;
      await DB.del('cards', c.id);
      state.cards = state.cards.filter((x) => x.id !== c.id);
      await recordSnapshot();
      toast('Carta removida');
      location.hash = '#/colecao';
    };
  }

  function openImage(src) {
    sheet(`<img src="${src}" style="width:100%;border-radius:16px;display:block" alt="" /><button class="btn btn-ghost btn-block" data-close>Fechar</button>`,
      (el, close) => { $('[data-close]', el).onclick = close; });
  }

  // ---------- Análise ----------
  function groupBy(arr, fn) { return arr.reduce((acc, x) => { (acc[fn(x)] ||= []).push(x); return acc; }, {}); }

  function viewInsights() {
    const t = totals();
    if (!state.cards.length) {
      return `<header class="topbar"><div><h1 class="page-title">Análise</h1><div class="page-sub">Raio-X da sua coleção</div></div></header>${emptyState()}`;
    }
    const byType = Object.entries(groupBy(state.cards, (c) => c.type || 'colorless'))
      .map(([k, l]) => ({ t: TYPE[k] || TYPE.colorless, v: l.reduce((s, c) => s + cardTotal(c), 0), n: l.length }))
      .sort((a, b) => b.v - a.v);
    const byRarity = Object.entries(groupBy(state.cards, (c) => c.rarity || 'Sem raridade'))
      .map(([k, l]) => ({ k, v: l.reduce((s, c) => s + cardTotal(c), 0), n: l.reduce((s, c) => s + (c.qty || 1), 0) }))
      .sort((a, b) => b.v - a.v);
    const bySet = Object.entries(groupBy(state.cards, (c) => c.set || 'Sem coleção'))
      .map(([k, l]) => ({ k, v: l.reduce((s, c) => s + cardTotal(c), 0), n: l.length }))
      .sort((a, b) => b.v - a.v).slice(0, 6);
    const withPaid = state.cards.filter((c) => c.paid > 0);
    const perf = withPaid.map((c) => ({ c, p: ((c.value - c.paid) / c.paid) * 100 })).sort((a, b) => b.p - a.p);
    const best = perf.slice(0, 3), worst = perf.filter((x) => x.p < 0).slice(-3).reverse();
    const avg = t.value / (t.count || 1);
    const maxCard = [...state.cards].sort((a, b) => b.value - a.value)[0];

    // donut
    const R = 54, C = 2 * Math.PI * R;
    let off = 0;
    const segs = byType.filter((x) => x.v > 0).map((x) => {
      const len = (x.v / (t.value || 1)) * C;
      const s = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${x.t.c}" stroke-width="18" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-off}"/>`;
      off += len; return s;
    }).join('');
    const maxR = byRarity[0]?.v || 1, maxS = bySet[0]?.v || 1;

    return `
      <header class="topbar"><div><h1 class="page-title">Análise</h1><div class="page-sub">Raio-X da sua coleção</div></div></header>

      <div class="kpis" style="margin-top:0">
        <div class="kpi"><small>Patrimônio</small><strong class="num">${moneyShort(t.value)}</strong><em>${t.count} cartas</em></div>
        <div class="kpi"><small>Resultado</small><strong class="num ${t.profit >= 0 ? 'up-t' : 'down-t'}">${moneyShort(t.profit)}</strong><em>${t.paid ? pct(t.profitPct) + ' sobre o investido' : 'informe o preço pago'}</em></div>
        <div class="kpi"><small>Valor médio</small><strong class="num">${moneyShort(avg)}</strong><em>por carta</em></div>
        <div class="kpi"><small>Carta mais valiosa</small><strong class="num">${moneyShort(maxCard.value)}</strong><em>${esc(maxCard.name)}</em></div>
      </div>

      <section class="section panel">
        <div class="section-head"><h2>Por tipo</h2></div>
        <div class="donut-wrap">
          <div class="donut"><svg viewBox="0 0 140 140"><circle r="${R}" cx="70" cy="70" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="18"/>${segs}</svg>
            <div class="center"><small>Tipos</small><strong>${byType.length}</strong></div></div>
          <div class="donut-legend">${byType.slice(0, 6).map((x) => `<div><i style="background:${x.t.c}"></i><span>${x.t.e} ${x.t.name}</span><b class="num">${pctFmt.format((x.v / (t.value || 1)) * 100)}%</b></div>`).join('')}</div>
        </div>
      </section>

      <section class="section panel">
        <div class="section-head"><h2>Por raridade</h2></div>
        <div class="bars">${byRarity.map((r, i) => `<div class="bar-row"><div class="bl"><b>${esc(r.k)}</b><span class="num">${moneyShort(r.v)} · ${r.n}x</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(r.v / maxR) * 100}%;animation-delay:${i * 60}ms"></div></div></div>`).join('')}</div>
      </section>

      <section class="section panel">
        <div class="section-head"><h2>Por coleção</h2></div>
        <div class="bars">${bySet.map((r, i) => `<div class="bar-row"><div class="bl"><b>${esc(r.k)}</b><span class="num">${moneyShort(r.v)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${(r.v / maxS) * 100}%;background:linear-gradient(90deg,#FFCB05,#FF7A3D);animation-delay:${i * 60}ms"></div></div></div>`).join('')}</div>
      </section>

      ${best.length ? `<section class="section"><div class="section-head"><h2>🚀 Maiores altas</h2></div>
        <div class="list">${best.map((x) => rowItem(x.c)).join('')}</div></section>` : ''}
      ${worst.length ? `<section class="section"><div class="section-head"><h2>📉 Em queda</h2></div>
        <div class="list">${worst.map((x) => rowItem(x.c)).join('')}</div></section>` : ''}`;
  }

  // ---------- Perfil / Ajustes ----------
  function viewSettings() {
    const t = totals();
    const mi = (bg, color, icon) => `<span class="mi" style="background:${bg};color:${color}">${icon}</span>`;
    return `
      <header class="topbar"><div><h1 class="page-title">Perfil</h1><div class="page-sub">Seus dados ficam salvos neste aparelho</div></div></header>

      <section class="panel profile-card">
        <div class="avatar">${esc(initials(state.trainer))}</div>
        <div style="flex:1;min-width:0">
          <input class="input" id="trainer" placeholder="Seu nome de treinador(a)" value="${esc(state.trainer)}" style="height:46px" />
          <div class="hint" style="margin-top:6px">${t.unique} cartas únicas · ${t.count} no total · ${money(t.value)}</div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Dados</h2></div>
        <div class="menu">
          <button id="export">${mi('rgba(61,125,255,.15)', '#7CA6FF', ICON.download)}<span class="mt">Exportar backup<small>Salva coleção e fotos em um arquivo .json</small></span><span class="chev">›</span></button>
          <button id="import">${mi('rgba(46,230,166,.15)', '#2EE6A6', ICON.upload)}<span class="mt">Importar backup<small>Restaura a partir de um arquivo .json</small></span><span class="chev">›</span></button>
          <button id="demo">${mi('rgba(255,203,5,.15)', '#FFCB05', ICON.spark)}<span class="mt">Adicionar cartas de exemplo<small>Para conhecer o app</small></span><span class="chev">›</span></button>
          <button id="wipe">${mi('rgba(255,77,106,.15)', '#FF4D6A', ICON.trash)}<span class="mt" style="color:var(--red)">Apagar tudo<small>Remove todas as cartas e o histórico</small></span><span class="chev">›</span></button>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Instalar no celular</h2></div>
        <div class="menu">
          <button id="install">${mi('rgba(181,107,255,.15)', '#C3A4FF', ICON.phone)}<span class="mt">Adicionar à tela inicial<small>Use como um app, em tela cheia</small></span><span class="chev">›</span></button>
        </div>
      </section>

      <p class="about"><span class="brand"><b>Poké</b>Value</span> · v1.0<br/>Fã-app não oficial, sem vínculo com Nintendo, The Pokémon Company ou Game Freak.<br/>Valores informados manualmente por você.</p>`;
  }

  function bindSettings() {
    $('#trainer').onchange = async (e) => { state.trainer = e.target.value.trim(); await DB.setMeta('trainer', state.trainer); toast('Nome salvo'); render(); };
    $('#export').onclick = exportData;
    $('#import').onclick = () => { const i = $('#file-import'); i.value = ''; i.click(); };
    $('#demo').onclick = loadDemo;
    $('#wipe').onclick = async () => {
      const ok = await confirmSheet({ title: 'Apagar tudo?', text: 'Todas as cartas, fotos e o histórico de patrimônio serão apagados deste aparelho. Exporte um backup antes, se quiser.', ok: 'Apagar tudo', danger: true });
      if (!ok) return;
      await DB.clear('cards'); await DB.clear('snapshots');
      state.cards = []; state.snapshots = [];
      toast('Coleção apagada'); location.hash = '#/';
    };
    $('#install').onclick = () => {
      if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; return; }
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      sheet(`<h3>Adicionar à tela inicial</h3>
        <p>${ios
          ? 'No Safari, toque no botão <b>Compartilhar</b> (quadrado com seta) e escolha <b>“Adicionar à Tela de Início”</b>.'
          : 'No Chrome, toque no menu <b>⋮</b> e escolha <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b>.'}</p>
        <p>O PokéValue abrirá em tela cheia, como um app nativo, e funciona até sem internet.</p>
        <button class="btn btn-primary btn-block" data-close>Entendi</button>`, (el, close) => { $('[data-close]', el).onclick = close; });
    };
  }

  async function exportData() {
    const data = { app: 'pokevalue', version: 1, exportedAt: new Date().toISOString(), trainer: state.trainer, cards: state.cards, snapshots: state.snapshots };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const name = `pokevalue-backup-${dayKey()}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Backup PokéValue' }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup exportado');
  }

  async function importData(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.cards)) throw new Error('formato');
      const ok = await confirmSheet({ title: 'Importar backup?', text: `${data.cards.length} cartas serão adicionadas/atualizadas na sua coleção.`, ok: 'Importar' });
      if (!ok) return;
      await DB.putMany('cards', data.cards);
      if (Array.isArray(data.snapshots)) await DB.putMany('snapshots', data.snapshots);
      if (data.trainer && !state.trainer) { state.trainer = data.trainer; await DB.setMeta('trainer', data.trainer); }
      await loadAll();
      await recordSnapshot();
      toast('Backup importado ✓'); location.hash = '#/';
      render();
    } catch (e) {
      console.error(e); toast('Arquivo de backup inválido');
    }
  }

  // ---------- dados de exemplo ----------
  async function loadDemo() {
    const now = Date.now(), day = 864e5;
    const demo = [
      ['Charizard ex', 'Obsidian Flames', '223/197', 'fire', 'Hiper Rara (Gold)', 520, 690],
      ['Pikachu ex', 'Surging Sparks', '238/191', 'lightning', 'Ilustração Especial Rara', 780, 1150],
      ['Umbreon VMAX', 'Evolving Skies', '215/203', 'darkness', 'Secreta', 2400, 3100],
      ['Mew ex', 'Pokémon 151', '205/165', 'psychic', 'Hiper Rara (Gold)', 180, 145],
      ['Greninja ex', 'Twilight Masquerade', '214/167', 'water', 'Ilustração Especial Rara', 650, 820],
      ['Rayquaza VMAX', 'Evolving Skies', '218/203', 'dragon', 'Secreta', 900, 1280],
      ['Sprigatito', 'Scarlet & Violet', '196/198', 'grass', 'Ilustração Rara', 35, 48],
      ['Iono', 'Paldea Evolved', '254/193', 'trainer', 'Ilustração Especial Rara', 310, 265],
    ];
    const cards = demo.map(([name, set, number, type, rarity, paid, value], i) => {
      const created = now - (85 - i * 6) * day;
      const steps = 4 + (i % 3);
      const hist = [];
      for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const noise = s === 0 || s === steps ? 0 : (Math.sin(i * 7 + s * 3) * 0.06);
        const v = s === steps ? value : Math.round((paid + (value - paid) * f) * (1 + noise));
        hist.push({ d: created + (now - 3 * day - created) * f, v });
      }
      return { id: uid(), name, set, number, type, rarity, condition: i % 4 === 3 ? 'SP' : 'NM', language: i % 3 === 2 ? 'Japonês' : 'Inglês', qty: i === 6 ? 3 : 1, paid, value, image: null, notes: '', favorite: i < 2, createdAt: created, updatedAt: now, priceHistory: hist, demo: true };
    });
    await DB.putMany('cards', cards);
    state.cards.push(...cards);
    // reconstrói o histórico de patrimônio dia a dia
    const snaps = [];
    for (let d = 90; d >= 0; d--) {
      const ts = now - d * day;
      let total = 0, invested = 0;
      state.cards.forEach((c) => {
        if ((c.createdAt || 0) > ts) return;
        const h = (c.priceHistory || []).filter((p) => p.d <= ts).pop();
        total += (h ? h.v : c.value) * (c.qty || 1);
        invested += (c.paid || 0) * (c.qty || 1);
      });
      if (total > 0) snaps.push({ date: dayKey(ts), total, invested, ts });
    }
    await DB.putMany('snapshots', snaps);
    state.snapshots = (await DB.all('snapshots')).sort((a, b) => a.date.localeCompare(b.date));
    await recordSnapshot();
    burst();
    toast('Cartas de exemplo adicionadas ✨');
    location.hash = '#/';
    render();
  }

  function notFound() {
    return `<div class="empty"><h3>Carta não encontrada</h3><p>Ela pode ter sido removida.</p><a class="btn btn-primary" href="#/colecao">Ver coleção</a></div>`;
  }

  // =========================================================
  // ROTEADOR
  // =========================================================
  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    return { name: parts[0] || '', id: parts[1], params: new URLSearchParams(qs || '') };
  }

  let lastRoute = '';
  function render(keepScroll) {
    const r = parseRoute();
    const view = $('#view');
    const key = location.hash;
    let html, bind, tab;
    switch (r.name) {
      case 'colecao': html = viewCollection(r.params); bind = bindCollection; tab = 'collection'; break;
      case 'nova': html = viewForm(null); bind = () => bindForm(null); tab = null; break;
      case 'editar': html = viewForm(r.id); bind = () => bindForm(r.id); tab = null; break;
      case 'carta': html = viewDetail(r.id); bind = () => bindDetail(r.id); tab = 'collection'; break;
      case 'analise': html = viewInsights(); bind = () => { const d = $('#load-demo'); if (d) d.onclick = loadDemo; }; tab = 'insights'; break;
      case 'ajustes': html = viewSettings(); bind = bindSettings; tab = 'settings'; break;
      default: html = viewHome(); bind = bindHome; tab = 'home';
    }
    if (!['nova', 'editar'].includes(r.name)) state.draft = null;
    const sameRoute = key === lastRoute;
    const y = window.scrollY;
    view.innerHTML = html;
    if (!sameRoute || !keepScroll) { view.style.animation = 'none'; void view.offsetHeight; view.style.animation = ''; }
    if (sameRoute && keepScroll) { view.style.animation = 'none'; window.scrollTo(0, y); } else if (!sameRoute) window.scrollTo(0, 0);
    lastRoute = key;
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    $('#tabbar').classList.toggle('hidden', ['nova', 'editar'].includes(r.name));
    try { bind && bind(); } catch (e) { console.error(e); }
  }

  // ---------- inicialização ----------
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

  async function loadAll() {
    state.cards = await DB.all('cards');
    state.snapshots = (await DB.all('snapshots')).sort((a, b) => a.date.localeCompare(b.date));
    state.trainer = await DB.getMeta('trainer', '');
  }

  async function init() {
    try { await loadAll(); } catch (e) { console.error(e); toast('Erro ao abrir o armazenamento local'); }
    if (state.cards.length) await recordSnapshot();
    $('#file-camera').onchange = (e) => handleImage(e.target.files[0]);
    $('#file-gallery').onchange = (e) => handleImage(e.target.files[0]);
    $('#file-import').onchange = (e) => e.target.files[0] && importData(e.target.files[0]);
    window.addEventListener('hashchange', () => render(true));
    render();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
