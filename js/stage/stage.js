/* Mode Stage : projection plein écran (amphithéâtre).
   Routes : #/stage (accueil) · #/stage/courbes[/n] (projection) · #/stage/courbes/presenter (vue enseignant).
   Principes : figure d'abord · une idée par écran · tailles en « u » (1 % de la hauteur d'écran × facteur de salle)
   · aucune information essentielle sous 2,2 u · tout se pilote au clavier / à la télécommande / au toucher. */
import './fr.js';
import { t, nf, setLang } from './i18n.js';
import { DECKS, resolve } from './scenes.js';
import { paintFigure, demFor, terrainCode, clamp } from './figure.js';
import { slopePct, contours, indexStep } from '../core/terrain.js';
import { h } from '../core/util.js';
import { recommendedScale } from './tools.js';

const KEY = 'gc_stage';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const save = o => { try { localStorage.setItem(KEY, JSON.stringify({ ...load(), ...o })); } catch (e) { } };

/* ---------- icônes (SVG, pas d'emoji : rendu identique sur tous les systèmes) ---------- */
const IC = {
  prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
  spot: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/>',
  pen: '<path d="M4 20l1-4.5L16.5 4 20 7.5 8.5 19z"/>', laser: '<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="8"/>',
  ask: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.3a2.8 2.8 0 115 1.6c-.8 1-2.3 1.4-2.3 3M12 17.2v.3"/>',
  blank: '<rect x="5" y="5" width="14" height="14" fill="currentColor"/>', full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  calib: '<path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2.4" fill="var(--st-bg)"/><circle cx="15" cy="16" r="2.4" fill="var(--st-bg)"/>',
  present: '<rect x="3" y="4" width="13" height="10" rx="1"/><path d="M8 19h13V9h-3"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.4v.4"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 010 16z" fill="currentColor"/>', exit: '<path d="M6 6l12 12M18 6L6 18"/>',
  clear: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const TOOLS = [['prev', 'ui.prev', '←'], ['next', 'ui.next', '→'], '|', ['spot', 'ui.spot', 'S'], ['zoom', 'ui.zoom', 'Z'], ['pen', 'ui.pen', 'P'], ['laser', 'ui.laser', 'L'], ['clear', 'ui.clear', 'C'], ['ask', 'ui.ask', 'Q'],
  '|', ['blank', 'ui.blank', 'B'], ['full', 'ui.full', 'F'], ['calib', 'ui.calib', 'K'], ['present', 'ui.present', 'V'], ['theme', 'ui.theme', 'T'], ['help', 'ui.help', 'H'], ['exit', 'ui.exit', 'Esc']];

/* ---------- état ---------- */
const initial = deck => ({ scene: 0, pi: 0, seed: null, probe: null, reveal: false, zoom: 1, cx: 80, cy: 55, spot: false, spotR: 16, tool: null, ask: false, blank: null, rs: 1, theme: 'light' });
const SNAP = ['scene', 'pi', 'seed', 'probe', 'reveal', 'zoom', 'cx', 'cy', 'spot', 'tool', 'ask', 'blank', 'rs', 'theme'];
const snapshot = S => Object.fromEntries(SNAP.map(k => [k, S[k]]));
const unitPx = rs => (innerWidth / innerHeight < 1.25 ? innerWidth * .0072 : innerHeight * .01) * rs;
const paramLabel = (scene, pi, revealed = true) => {
  const p = scene.param; if (!p) return '';
  if (scene.hide === 'formname' && !revealed) return t('ui.formN', { n: pi + 1, m: p.values.length });
  if (p.labels) return t(p.labels[pi]);
  return nf(p.values[pi]) + ' m';
};

/* ---------- lectures (panneau latéral) ---------- */
const slopeCls = p => p < 8 ? 0 : p < 15 ? 1 : p < 30 ? 2 : 3;
function readout(S, A) {
  const { scene, cfg, d, probe } = A, id = scene.id, hidden = scene.hide === 'probe' && !S.reveal;
  const big = (k, v, sub) => `<div class="st-k">${k}</div><div class="st-big">${v}</div>${sub ? `<div class="st-sub">${sub}</div>` : ''}`;
  if (id === 'plane') return big(t('map.curves'), nf(A.meta.levels), t('read.plane'));
  if (id === 'eq') { const n = contours(d, cfg.eq).length; return big(t('map.curves'), nf(n), t('map.every', { m: indexStep(cfg.eq) })); }
  if (id === 'forms') { const f = scene.param.values[S.pi]; return S.reveal ? `<div class="st-big sm">${t('form.' + f)}</div><div class="st-sub">${t('rule.' + f)}</div>` : `<div class="st-big">${t('ui.unknown')}</div><div class="st-sub">${t('ui.revealHint')}</div>`; }
  if (id === 'v') return `<div class="st-big sm">${t('v.' + S.pi)}</div>`;
  if (!probe) return `<div class="st-sub">${t('ui.probeHint')}</div>`;
  const z = A.zAt(probe), eq = cfg.eq;
  if (id === 'read') return hidden ? big(t('read.alt'), t('ui.unknown'), t('ui.revealHint')) : big(t('read.alt'), '≈ ' + nf(Math.round(z)) + ' m', t('read.between', { a: nf(Math.floor(z / eq) * eq), b: nf(Math.ceil(z / eq) * eq) }));
  const p = slopePct(d, probe.x, probe.y), gap = p > 0.5 ? eq / p * 100 : Infinity, deg = Math.atan(p / 100) * 180 / Math.PI;
  if (id === 'gap') return big(t('read.slope'), nf(p, 0) + ' %', `${nf(deg, 0)}° · ${t('read.slopeClass.' + slopeCls(p))}`) +
    `<div class="st-k mt">${t('read.gap')}</div><div class="st-big sm">${isFinite(gap) ? nf(gap, 0) + ' m' : '∞'}</div><div class="st-sub">${isFinite(gap) ? nf(gap / (d.scaleN / 100), 1) + ' cm ' + t('read.gapMap', { n: nf(d.scaleN) }) : t('read.flat')}</div><div class="st-sub fm">${t('read.formula')}</div>`;
  return big(t('read.alt'), '≈ ' + nf(Math.round(z)) + ' m', `${t('read.slope')} ${nf(p, 0)} % · ${t('read.slopeClass.' + slopeCls(p))}`);
}
const legend = (cfg, scene) => {
  const sw = (c, wd, extra = '') => `<svg class="st-sw" viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5H40" stroke="${c}" stroke-width="${wd}" ${extra}/></svg>`;
  const rows = [[sw('#8a4313', 2.4), t('map.contour')], [sw('#4a2208', 5), t('map.index')]];
  if (cfg.layers.spots) rows.push([`<svg class="st-sw" viewBox="0 0 40 10"><path d="M20 0l7 9H13z" fill="#111"/></svg>`, t('map.summit')]);
  if (cfg.layers.rivers) rows.push([sw('#0a58b0', 4), t('map.river')]);
  if (cfg.layers.crest) rows.push([sw('#c62828', 4, 'stroke-dasharray="1 7" stroke-linecap="round"'), t('map.crest')]);
  return rows.map(([s, l]) => `<div class="st-lg">${s}<span>${l}</span></div>`).join('');
};

/* ---------- réglage de la salle : voir tools.js ---------- */
export { recommendedScale };

/* =====================================================================
   PROJECTION
   ===================================================================== */
async function mountStage(root, deck, startScene) {
  const saved = load(), S = initial(deck);
  S.rs = saved.rs || 1; S.theme = saved.theme || 'light'; S.scene = clamp((startScene || 1) - 1, 0, deck.scenes.length - 1);
  setLang(saved.lang || 'fr');
  document.body.classList.add('stage-on');

  const el = h('div', { class: 'stg', 'data-theme': S.theme });
  el.innerHTML = `
  <header class="st-head"><div class="st-no" id="stNo"></div><div class="st-ht"><h1 class="st-title" id="stTitle"></h1><p class="st-say" id="stSay"></p></div><div class="st-prog" id="stProg"></div></header>
  <div class="st-body">
    <section class="st-fig" id="stFig"><div class="st-pair" id="stPair">
      <div class="st-box st-isobox" id="isoBox"><canvas id="isoCv"></canvas></div>
      <div class="st-box st-mapbox" id="mapBox"><canvas id="bdCv"></canvas><svg id="svg" role="img"></svg><span class="st-zb" id="zoomBadge"></span></div>
    </div></section>
    <aside class="st-side" id="stSide"><div class="st-card" id="cardParam"></div><div class="st-card" id="cardRead"></div><div class="st-card st-legend" id="cardLeg"></div><div class="st-code" id="stCode"></div></aside>
  </div>
  <nav class="st-tools" id="stTools" aria-label="Outils de présentation"></nav>
  <div class="st-spot" id="stSpot"></div><canvas class="st-ink" id="stInk"></canvas><div class="st-laser" id="stLaser"></div>
  <div class="st-ask" id="stAsk" role="dialog"></div><div class="st-blank" id="stBlank"></div><div class="st-modal" id="stModal" role="dialog"></div>
  <div class="st-hint" id="stHint"></div><div class="st-sr" id="stSr" aria-live="polite"></div>`;
  root.append(el);
  const $ = s => el.querySelector(s);
  $('#stTools').innerHTML = TOOLS.map(x => x === '|' ? '<i class="st-sep"></i>' : `<button class="st-b" data-act="${x[0]}" aria-label="${t(x[1])}" title="${t(x[1])} (${x[2]})">${icon(x[0])}</button>`).join('');
  const els = { bd: $('#bdCv'), svg: $('#svg'), iso: $('#isoCv') };
  let A = null, raf = 0, sc = 0;

  /* ---- synchronisation avec la vue présentateur ---- */
  let ch = null; try { ch = new BroadcastChannel('gc-stage-' + deck.id); } catch (e) { }
  const post = () => ch && ch.postMessage({ t: 'state', S: snapshot(S), meta: { n: deck.scenes.length } });

  /* ---- rendu ---- */
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
  function render() {
    const u = unitPx(S.rs), scene = deck.scenes[S.scene];
    el.style.setProperty('--u', u + 'px'); el.dataset.theme = S.theme;
    const fig = $('#stFig').getBoundingClientRect(), pad = 1.2 * u;
    A = paintFigure(els, S, deck, { w: Math.max(100, fig.width - pad), h: Math.max(100, fig.height - pad), u });
    const b = A.box;
    $('#isoBox').style.display = A.split ? 'block' : 'none';
    $('#isoBox').style.width = b.iw + 'px'; $('#isoBox').style.height = b.ih + 'px';
    $('#mapBox').style.width = b.mw + 'px'; $('#mapBox').style.height = b.mh + 'px';
    els.svg.setAttribute('aria-label', t('s.' + scene.id + '.title'));
    $('#zoomBadge').textContent = S.zoom > 1 ? t('ui.zoomBadge', { z: S.zoom }) : ''; $('#zoomBadge').style.display = S.zoom > 1 ? '' : 'none';
    $('#stNo').textContent = S.scene + 1; $('#stTitle').textContent = t('s.' + scene.id + '.title'); $('#stSay').textContent = t('s.' + scene.id + '.say');
    $('#stProg').innerHTML = `<span>${t('ui.scene', { n: S.scene + 1, m: deck.scenes.length })}</span><span class="st-dots">${deck.scenes.map((_, i) => `<i class="${i === S.scene ? 'on' : i < S.scene ? 'dn' : ''}"></i>`).join('')}</span>`;
    const p = scene.param;
    $('#cardParam').innerHTML = p
      ? `<div class="st-k">${t('s.' + scene.id + '.param')}</div><div class="st-big ${/^\d/.test(paramLabel(scene, S.pi, S.reveal)) ? '' : 'sm'}">${paramLabel(scene, S.pi, S.reveal)}</div><div class="st-pbtns"><button class="st-b lg" data-act="down" aria-label="−">${icon('down')}</button><button class="st-b lg" data-act="up" aria-label="+">${icon('up')}</button><span class="st-dots lg">${p.values.map((_, i) => `<i class="${i === S.pi ? 'on' : ''}"></i>`).join('')}</span></div>`
      : '';
    $('#cardParam').style.display = p ? '' : 'none';
    $('#cardRead').innerHTML = readout(S, A); $('#cardLeg').innerHTML = legend(A.cfg, scene);
    const code = terrainCode(A.cfg); $('#stCode').textContent = code ? t('ui.code', { c: code }) : '';
    el.querySelectorAll('[data-act]').forEach(b => { const a = b.dataset.act; if (['spot', 'pen', 'laser', 'zoom', 'ask'].includes(a)) b.setAttribute('aria-pressed', String(a === 'spot' ? S.spot : a === 'zoom' ? S.zoom > 1 : a === 'ask' ? S.ask : S.tool === a)); });
    $('#stSpot').style.display = S.spot ? '' : 'none'; $('#stSpot').style.setProperty('--sr', S.spotR * u + 'px');
    $('#stLaser').style.display = S.tool === 'laser' ? '' : 'none';
    el.classList.toggle('pen', S.tool === 'pen'); el.classList.toggle('laser', S.tool === 'laser');
    $('#stAsk').innerHTML = S.ask ? `<div class="st-ask-in"><div class="st-ask-k">${t('ui.question')}</div><div class="st-ask-q">${t('s.' + scene.id + '.ask')}</div></div>` : ''; $('#stAsk').style.display = S.ask ? 'flex' : 'none';
    $('#stBlank').style.display = S.blank ? 'block' : 'none'; $('#stBlank').dataset.c = S.blank || '';
    redrawInk(); post();
  }
  const announce = () => { $('#stSr').textContent = t('s.' + deck.scenes[S.scene].id + '.title') + '. ' + t('s.' + deck.scenes[S.scene].id + '.say'); };

  /* ---- encre ---- */
  const ink = $('#stInk'); let strokes = [], cur = null;
  function redrawInk() {
    const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    if (ink.width !== Math.round(W * dpr) || ink.height !== Math.round(H * dpr)) { ink.width = Math.round(W * dpr); ink.height = Math.round(H * dpr); ink.style.width = W + 'px'; ink.style.height = H + 'px'; }
    const c = ink.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H); c.lineCap = c.lineJoin = 'round';
    const u = unitPx(S.rs);
    for (const pass of [0, 1]) for (const s of strokes) {
      c.strokeStyle = pass ? '#e11d1d' : '#ffffff'; c.lineWidth = (pass ? .7 : 1.4) * u; c.beginPath();
      s.forEach(([x, y], i) => i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H)); if (s.length === 1) c.lineTo(s[0][0] * W + .1, s[0][1] * H); c.stroke();
    }
  }
  ink.addEventListener('pointerdown', e => { if (S.tool !== 'pen') return; ink.setPointerCapture(e.pointerId); cur = [[e.clientX / innerWidth, e.clientY / innerHeight]]; strokes.push(cur); redrawInk(); });
  ink.addEventListener('pointermove', e => { if (cur) { cur.push([e.clientX / innerWidth, e.clientY / innerHeight]); redrawInk(); } });
  ink.addEventListener('pointerup', () => { cur = null; });

  /* ---- pointeur : projecteur + laser + masquage au repos ---- */
  let idle = 0;
  const wake = () => { el.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => el.classList.add('idle'), 3200); };
  el.addEventListener('pointermove', e => {
    const sp = $('#stSpot'); sp.style.setProperty('--sx', e.clientX + 'px'); sp.style.setProperty('--sy', e.clientY + 'px');
    const l = $('#stLaser'); l.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; wake();
  });
  el.addEventListener('wheel', e => { if (S.spot) { e.preventDefault(); S.spotR = clamp(S.spotR + (e.deltaY < 0 ? 1.5 : -1.5), 6, 60); schedule(); } }, { passive: false });
  wake();

  /* ---- carte : sonde, déplacement (zoom), balayage (changer de scène) ---- */
  const mb = $('#mapBox'); let dn = null;
  const pointToGrid = e => { const r = els.svg.getBoundingClientRect(); return { x: A.view.x0 + (e.clientX - r.left) / A.k, y: A.view.y0 + (e.clientY - r.top) / A.k }; };
  mb.addEventListener('pointerdown', e => { if (S.tool === 'pen') return; mb.setPointerCapture(e.pointerId); dn = { x: e.clientX, y: e.clientY, cx: S.cx, cy: S.cy, moved: false }; });
  mb.addEventListener('pointermove', e => {
    if (!dn) return; const dx = e.clientX - dn.x, dy = e.clientY - dn.y; if (Math.hypot(dx, dy) > 9) dn.moved = true;
    if (dn.moved && S.zoom > 1) { S.cx = dn.cx - dx / A.k; S.cy = dn.cy - dy / A.k; strokes = []; schedule(); }
  });
  mb.addEventListener('pointerup', e => {
    if (!dn) return; const dx = e.clientX - dn.x, dy = e.clientY - dn.y, u = unitPx(S.rs), scene = deck.scenes[S.scene];
    if (!dn.moved && scene.probe) { S.probe = pointToGrid(e); S.reveal = false; schedule(); }
    else if (dn.moved && S.zoom === 1 && Math.abs(dx) > 12 * u && Math.abs(dx) > 2 * Math.abs(dy)) act(dx < 0 ? 'next' : 'prev');
    dn = null;
  });

  /* ---- actions (clavier, boutons, télécommande, vue présentateur) ---- */
  const resetFigure = () => { S.probe = null; S.reveal = false; S.zoom = 1; S.cx = 80; S.cy = 55; strokes = []; };
  function act(a, v) {
    const scene = deck.scenes[S.scene], p = scene.param;
    if (S.blank && a !== 'blank') { S.blank = null; schedule(); if (a !== 'next' && a !== 'prev') return; }
    switch (a) {
      case 'next': case 'prev': { const n = clamp(S.scene + (a === 'next' ? 1 : -1), 0, deck.scenes.length - 1); if (n !== S.scene) { S.scene = n; S.pi = 0; S.seed = null; S.ask = false; resetFigure(); announce(); } break; }
      case 'goto': { const n = clamp(v, 0, deck.scenes.length - 1); if (n !== S.scene) { S.scene = n; S.pi = 0; S.seed = null; S.ask = false; resetFigure(); announce(); } break; }
      case 'up': case 'down': if (p) { S.pi = clamp(S.pi + (a === 'up' ? 1 : -1), 0, p.values.length - 1); S.probe = null; S.reveal = false; strokes = []; } break;
      case 'spot': S.spot = !S.spot; break;
      case 'zoom': { S.zoom = S.zoom >= 3 ? 1 : S.zoom + 1; if (S.zoom > 1 && A) { const pt = lastPt ? pointToGrid(lastPt) : { x: 80, y: 55 }; S.cx = pt.x; S.cy = pt.y; } else { S.cx = 80; S.cy = 55; } strokes = []; break; }
      case 'pen': S.tool = S.tool === 'pen' ? null : 'pen'; break;
      case 'laser': S.tool = S.tool === 'laser' ? null : 'laser'; break;
      case 'clear': strokes = []; break;
      case 'ask': S.ask = !S.ask; break;
      case 'reveal': S.reveal = true; break;
      case 'regen': if (scene.regen) { S.seed = Math.floor(Math.random() * 1e6) + 1; S.probe = null; S.reveal = false; strokes = []; } break;
      case 'blank': S.blank = (v || 'black') === S.blank ? null : (v || 'black'); break;
      case 'full': if (document.fullscreenElement) document.exitFullscreen(); else (document.documentElement.requestFullscreen || (() => { })).call(document.documentElement); return;
      case 'theme': S.theme = S.theme === 'light' ? 'dark' : 'light'; save({ theme: S.theme }); break;
      case 'scale': S.rs = clamp(Math.round((S.rs + v) * 20) / 20, .8, 2.5); save({ rs: S.rs }); break;
      case 'setScale': S.rs = clamp(v, .8, 2.5); save({ rs: S.rs }); break;
      case 'spotSize': S.spotR = clamp(S.spotR + v, 6, 60); break;
      case 'pan': if (S.zoom > 1) { S.cx += v[0] * (A.view.w / 4); S.cy += v[1] * (A.view.h / 4); strokes = []; } break;
      case 'calib': return openModal('calib');
      case 'help': return openModal('help');
      case 'present': window.open(location.href.replace(/#.*$/, '') + '#/stage/' + deck.id + '/presenter', 'gc-presenter', 'popup,width=1180,height=780'); return;
      case 'exit': if (closeModal()) return; if (S.ask) { S.ask = false; break; } if (document.fullscreenElement) document.exitFullscreen(); location.hash = deck.exitRoute; return;
    }
    schedule();
  }
  let lastPt = null; el.addEventListener('pointermove', e => { lastPt = e; });
  el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) { act(b.dataset.act); e.stopPropagation(); } else if (S.blank) { S.blank = null; schedule(); } });
  if (ch) ch.onmessage = ev => { const m = ev.data; if (m.t === 'hello') post(); else if (m.t === 'cmd') act(m.a, m.v); };

  /* ---- fenêtres modales : aide et réglage de la salle ---- */
  const modal = $('#stModal'); let modalKind = null;
  function closeModal() { if (!modalKind) return false; modalKind = null; modal.style.display = 'none'; modal.innerHTML = ''; return true; }
  function openModal(kind) {
    if (modalKind === kind) { closeModal(); return; } modalKind = kind; modal.style.display = 'flex';
    if (kind === 'help') {
      modal.innerHTML = `<div class="st-sheet"><h2>${t('help.title')}</h2><div class="st-keys">${t('help.keys').map(([k, d]) => `<div><kbd>${k}</kbd><span>${d}</span></div>`).join('')}</div><button class="st-btn" data-m="close">${t('ui.close')}</button></div>`;
    } else {
      const wv = load().roomW || 3, dv = load().roomD || 12;
      modal.innerHTML = `<div class="st-sheet"><h2>${t('calib.title')}</h2><p class="st-lead">${t('calib.lead')}</p>
        <div class="st-chart"><span>1 245</span><span>612</span><span>3 870</span><span>988</span><span>2 054 m</span></div>
        <div class="st-row"><b>${t('calib.presets')}</b>${[[1, 'calib.p.1'], [1.5, 'calib.p.1.5'], [2, 'calib.p.2']].map(([v, k]) => `<button class="st-btn sec" data-m="scale" data-v="${v}">${t(k)}</button>`).join('')}</div>
        <div class="st-row"><label>${t('calib.scale', { s: '<b id="cs">' + nf(S.rs, 2) + '</b>' })}<input type="range" id="crs" min="0.8" max="2.5" step="0.05" value="${S.rs}"></label></div>
        <h3>${t('calib.calc')}</h3><div class="st-row"><label>${t('calib.width')} <input type="number" id="cw" min="1" max="12" step="0.5" value="${wv}"></label><label>${t('calib.dist')} <input type="number" id="cd" min="2" max="60" step="1" value="${dv}"></label></div>
        <p class="st-sub" id="cres"></p><p class="st-sub">${t('calib.cap')}</p><div class="st-row"><button class="st-btn" data-m="apply">${t('calib.apply')}</button><button class="st-btn sec" data-m="close">${t('calib.ok')}</button></div></div>`;
      const upd = () => { const r = recommendedScale(+modal.querySelector('#cw').value, +modal.querySelector('#cd').value); modal.querySelector('#cres').textContent = t('calib.result', { d: modal.querySelector('#cd').value, p: nf(r.pct, 1), s: nf(r.scale, 2) }); return r; };
      modal.oninput = e => { if (e.target.id === 'crs') { act('setScale', +e.target.value); modal.querySelector('#cs').textContent = nf(S.rs, 2); } else { upd(); save({ roomW: +modal.querySelector('#cw').value, roomD: +modal.querySelector('#cd').value }); } };
      upd();
    }
  }
  modal.addEventListener('click', e => {
    const b = e.target.closest('[data-m]'); if (!b) { if (e.target === modal) closeModal(); return; }
    e.stopPropagation(); const m = b.dataset.m;
    if (m === 'close') closeModal();
    else if (m === 'scale') { act('setScale', +b.dataset.v); modal.querySelector('#crs') && (modal.querySelector('#crs').value = S.rs, modal.querySelector('#cs').textContent = nf(S.rs, 2)); }
    else if (m === 'apply') { const r = recommendedScale(+modal.querySelector('#cw').value, +modal.querySelector('#cd').value); act('setScale', Math.round(r.scale * 20) / 20); modal.querySelector('#crs').value = S.rs; modal.querySelector('#cs').textContent = nf(S.rs, 2); }
  });

  /* ---- clavier (télécommandes : PgUp/PgDn, flèches, « . » = écran noir) ---- */
  const onKey = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.key !== 'Escape') return;
    const k = e.key, K = k.length === 1 ? k.toLowerCase() : k;
    const map = { ArrowRight: 'next', PageDown: 'next', ' ': 'next', Enter: 'next', ArrowLeft: 'prev', PageUp: 'prev', Backspace: 'prev', ArrowUp: 'up', ArrowDown: 'down', s: 'spot', z: 'zoom', p: 'pen', l: 'laser', c: 'clear', q: 'ask', r: 'reveal', n: 'regen', f: 'full', k: 'calib', v: 'present', t: 'theme', h: 'help', '?': 'help', Escape: 'exit', '.': 'blank', b: 'blank' };
    if (e.shiftKey && k.startsWith('Arrow')) { e.preventDefault(); return act('pan', { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]); }
    if (/^[1-9]$/.test(k)) { e.preventDefault(); return act('goto', +k - 1); }
    if (k === '+' || k === '=') return act('scale', .1); if (k === '-' || k === '_') return act('scale', -.1);
    if (k === '[') return act('spotSize', -2); if (k === ']') return act('spotSize', 2);
    if (K === 'w') return act('blank', 'white');
    const a = map[K]; if (!a) return; e.preventDefault(); wake();
    if (e.repeat && !['up', 'down'].includes(a)) return; act(a);
  };
  addEventListener('keydown', onKey);
  const onResize = () => schedule(); addEventListener('resize', onResize); document.addEventListener('fullscreenchange', onResize);
  const ro = new ResizeObserver(onResize); ro.observe($('#stFig'));
  render(); announce();
  const hint = $('#stHint'); if (!document.fullscreenElement) { hint.textContent = t('ui.fsHint'); setTimeout(() => hint.classList.add('off'), 7000); }
  window.__stage = { S, act, get A() { return A; }, deck };      // aide au test / débogage
  return () => { removeEventListener('keydown', onKey); removeEventListener('resize', onResize); document.removeEventListener('fullscreenchange', onResize); ro.disconnect(); ch && ch.close(); clearTimeout(idle); cancelAnimationFrame(raf); document.body.classList.remove('stage-on'); el.remove(); delete window.__stage; };
}

/* =====================================================================
   VUE PRÉSENTATEUR (2ᵉ fenêtre : notes, question, minuteur, commandes, aperçu)
   ===================================================================== */
async function mountPresenter(root, deck) {
  setLang(load().lang || 'fr');
  const S = initial(deck); let live = false, t0 = Date.now(), ts = Date.now(), lastScene = -1, raf = 0;
  document.body.classList.add('stage-pv');
  const el = h('div', { class: 'pv' }); root.append(el);
  el.innerHTML = `<h1>${t('pres.title')}</h1><p class="pv-status" id="pvStat"></p>
   <div class="pv-grid"><section class="pv-main"><div class="pv-scene" id="pvScene"></div>
    <div class="pv-card"><h3>${t('pres.note')}</h3><p id="pvNote"></p></div><div class="pv-card ask"><h3>${t('pres.question')}</h3><p id="pvAsk"></p></div><div class="pv-card"><h3>${t('pres.next')}</h3><p id="pvNext"></p></div></section>
    <section class="pv-side"><div class="pv-card"><h3>${t('pres.preview')}</h3><div class="stg st-pvprev" id="pvPrev" data-theme="light"><div class="st-pair"><div class="st-box st-isobox" id="pisoBox"><canvas id="pisoCv"></canvas></div><div class="st-box st-mapbox" id="pmapBox"><canvas id="pbdCv"></canvas><svg id="psvg"></svg></div></div></div></div>
    <div class="pv-card"><h3>${t('pres.timer')}</h3><p class="pv-time"><b id="pvT"></b> · ${t('pres.sceneTimer')} <b id="pvTs"></b></p></div>
    <div class="pv-card"><h3>${t('pres.controls')}</h3><div class="pv-btns" id="pvBtns"></div></div>
    <div class="pv-card"><h3>${t('pres.scenes')}</h3><div class="pv-list" id="pvList"></div></div></section></div>`;
  const $ = s => el.querySelector(s), btns = [['prev', 'ui.prev'], ['next', 'ui.next'], ['down', '−'], ['up', '+'], ['spot', 'ui.spot'], ['zoom', 'ui.zoom'], ['ask', 'ui.ask'], ['reveal', 'ui.reveal'], ['regen', 'ui.newterrain'], ['blank', 'ui.blank']];
  $('#pvBtns').innerHTML = btns.map(([a, l]) => `<button class="pv-b" data-a="${a}">${l.startsWith('ui.') ? t(l) : l}</button>`).join('');
  $('#pvList').innerHTML = deck.scenes.map((s, i) => `<button class="pv-b l" data-a="goto" data-v="${i}">${i + 1}. ${t('s.' + s.id + '.title')}</button>`).join('');
  let ch = null; try { ch = new BroadcastChannel('gc-stage-' + deck.id); } catch (e) { }
  const send = (a, v) => ch && ch.postMessage({ t: 'cmd', a, v });
  el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) send(b.dataset.a, b.dataset.v != null ? +b.dataset.v : undefined); });
  const els = { bd: $('#pbdCv'), svg: $('#psvg'), iso: $('#pisoCv') };
  const draw = () => {
    const scene = deck.scenes[S.scene]; if (S.scene !== lastScene) { ts = Date.now(); lastScene = S.scene; }
    $('#pvScene').innerHTML = `<span class="pv-no">${S.scene + 1}</span><div><h2>${t('s.' + scene.id + '.title')}</h2><p>${t('s.' + scene.id + '.say')}</p></div>`;
    $('#pvNote').textContent = t('s.' + scene.id + '.note'); $('#pvAsk').textContent = t('s.' + scene.id + '.ask');
    const nx = deck.scenes[S.scene + 1]; $('#pvNext').textContent = nx ? t('s.' + nx.id + '.title') : '—';
    el.querySelectorAll('#pvList .pv-b').forEach((b, i) => b.classList.toggle('on', i === S.scene));
    const w = Math.min(520, el.clientWidth * .4), hgt = w * 109 / 159 * 1.02, u = Math.max(3.2, w * .0118);
    $('#pvPrev').style.setProperty('--u', u + 'px'); $('#pvPrev').style.height = hgt + 'px';
    const a = paintFigure(els, S, deck, { w: w - 4, h: hgt, u });
    $('#pisoBox').style.display = a.split ? 'block' : 'none'; $('#pisoBox').style.width = a.box.iw + 'px'; $('#pisoBox').style.height = a.box.ih + 'px';
    $('#pmapBox').style.width = a.box.mw + 'px'; $('#pmapBox').style.height = a.box.mh + 'px';
  };
  const stat = () => { $('#pvStat').textContent = live ? t('pres.connected') : t('pres.waiting'); $('#pvStat').className = 'pv-status ' + (live ? 'ok' : ''); };
  if (ch) ch.onmessage = ev => { const m = ev.data; if (m.t === 'state') { Object.assign(S, m.S); live = true; stat(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } };
  const fmt = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const tick = setInterval(() => { $('#pvT').textContent = fmt(Date.now() - t0); $('#pvTs').textContent = fmt(Date.now() - ts); }, 500);
  /* clavier : mêmes touches de navigation que la projection */
  const onKey = e => { const m = { ArrowRight: 'next', PageDown: 'next', ArrowLeft: 'prev', PageUp: 'prev', ArrowUp: 'up', ArrowDown: 'down' }[e.key]; if (m) { e.preventDefault(); send(m); } };
  addEventListener('keydown', onKey);
  draw(); stat(); ch && ch.postMessage({ t: 'hello' });
  if (!ch || location.protocol === 'file:') { const w = h('p', { class: 'pv-warn' }, t('pres.noSync')); el.insertBefore(w, el.children[2]); }
  const open = h('button', { class: 'pv-b', onclick: () => window.open(location.href.replace(/#.*$/, '') + '#/stage/' + deck.id, 'gc-stage', 'popup,width=1280,height=720') }, t('pres.openStage')); el.insertBefore(open, el.children[2]);
  return () => { document.body.classList.remove('stage-pv'); clearInterval(tick); removeEventListener('keydown', onKey); ch && ch.close(); cancelAnimationFrame(raf); el.remove(); };
}

/* =====================================================================
   ROUTAGE : #/stage (index des 11 thèmes) · #/stage/<leçon v2>[/n|presenter] · #/stage/courbes[/n|presenter] (decks v1)
   ===================================================================== */
export default async function (root, { a, b }) {
  const { lessonById } = await import('./lessons/index.js');
  const lesson = await import('./lesson.js');
  if (!a) return lesson.lessonIndex(root);
  if (a === 'fil') { const pg = await import('./pages.js'); return pg.mountFil(root); }
  if (a === 'lib' || a === 'bilan') { const pg = await import('./pages.js'); return a === 'lib' ? pg.mountLib(root) : pg.mountBilan(root); }
  if (lessonById(a)) return lesson.mountLesson(root, a, b);
  const deck = DECKS[a]; if (!deck) return lesson.lessonIndex(root);
  if (b === 'presenter') return mountPresenter(root, deck);
  return mountStage(root, deck, +b || 1);
}
