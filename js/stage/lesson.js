/* Mode Stage v2 — exécution d'une LEÇON (suite de scènes) en projection.
   Routes : #/stage (index des 11 thèmes) · #/stage/<leçon>[/n] (projection, n = scène) · #/stage/<leçon>/presenter (vue enseignant).
   Modèle : leçon → scènes → étapes. Une scène = UNE idée ; une étape = UN élément révélé. → / espace : étape suivante ; ← : précédente ;
   ↑ ↓ : paramètre de la scène ; a b c d : votes ; B : écran vide ; T : thème ; + − : taille de salle ; F : plein écran ; P : présentateur ; Échap : sortir.
   Rien n'est dessiné en pixels : tout est dans le repère logique 160×70 de kit.js (même rendu, du smartphone à l'amphi). */
import './fr.js';
import './lessons/fr.js';
import { t, nf, setLang, has } from './i18n.js';
import * as K from './kit.js';
import { TOPICS, lessonById } from './lessons/index.js';
import { h } from '../core/util.js';
import { loadPrefs, savePrefs, logVote, unitPx, fmtClock, safeHtml, words, passiveRun, mazur, optionOrder, invertOrder, chromeUnit } from './tools.js';
import { pickExo } from '../engine/pedagogy/index.js';
import { threadHtml, threadNote } from './thread.js';

const ICON = {
  prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>', up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  blank: '<rect x="5" y="5" width="14" height="14" fill="currentColor"/>', full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  present: '<rect x="3" y="4" width="13" height="10" rx="1"/><path d="M8 19h13V9h-3"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.4v.4"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 010 16z" fill="currentColor"/>', exit: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', regen: '<path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5"/>'
};
const ic = (d, s = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${s}>${d}</svg>`;
const kindIc = k => ic(`<path d="${K.KINDS[k].ic}"/>`);
const LET = 'ABCD';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ---------- accès aux données d'une scène ---------- */
export const stepsOf = (sc, ctx) => sc.kind === 'vote' || sc.practice ? 3 : typeof sc.steps === 'function' ? sc.steps(ctx) : (sc.steps || 1);
export const paramOf = (sc, pi) => sc.param ? sc.param.values[Math.min(pi, sc.param.values.length - 1)] : null;
const key = (L, sc, k) => `${L.id}.${sc.id}.${k}`;
function capKey(L, sc, st) { for (let k = st; k >= 0; k--) if (has(key(L, sc, 'c' + k))) return key(L, sc, 'c' + k); return null; }
const wrap = K.wrap; // (encore utilisé par d'autres modules)

/* ---------- exercices du moteur (scènes « practice ») : courts, pour être lus de loin ---------- */
const exoCache = new Map();
function exoFor(sc, seed) {
  const k = sc.id + '|' + seed; if (exoCache.has(k)) return exoCache.get(k);
  let ex = null;
  for (let i = 0; i < 40 && !ex; i++) { const e = pickExo(sc.practice.ch, seed * 31 + i * 7 + 1); if (words(e.prompt) <= (sc.practice.maxWords || 34)) ex = e; }
  ex = ex || pickExo(sc.practice.ch, seed); exoCache.set(k, ex); return ex;
}
const fmtAns = f => { const a = f.a, r = Math.abs(a) >= 100 ? Math.round(a) : Math.round(a * 100) / 100; return `${f.l} ${nf(r, 2)} ${f.u || ''}`.trim(); };

/* Légende : tient dans 24 % de la hauteur d'écran (sinon elle écrase la figure). Police de départ 4,9 u de chrome, réduite jusqu'à 4,2 % de la hauteur
   d'écran ; si le détail d'une correction (explication du malentendu) ne tient pas, on ne garde que le nom du malentendu : l'explication reste
   dans la vue présentateur et la bibliothèque des malentendus. Dernier recours : police minimale. */
/* Titre de la scène : au plus 11 % de la hauteur d'écran (sinon, à 4:3 ou à forte échelle, il passe sur 4 lignes, écrase la légende et repousse le rail
   hors de l'écran : audit v3.1). Police de départ 4,6 u de chrome, réduite jusqu'à 3,8 % de la hauteur d'écran. */
function fitClaim(el, uc) {
  const H = innerHeight, budget = .11 * H, start = 4.6 * uc, floor = Math.min(start, .038 * H), step = Math.max(.4, start * .04);
  for (let px = start; px >= floor - .01; px -= step) { el.style.fontSize = px + 'px'; if (el.scrollHeight <= budget) return; }
  el.style.fontSize = floor + 'px';
}
/* Fil du raisonnement : une seule rangée. On essaie d'abord les six étapes avec leur nom (police 4,6 u de chrome, réduite jusqu'à 3,8 % de la hauteur d'écran ; la rangée ne dépasse jamais 9 % de la hauteur) ;
   si elles ne tiennent pas (4:3, 16:10, amphi), les étapes non courantes ne gardent que leur numéro et l'étape courante garde son nom. */
function fitThread(nav) {
  const ol = nav.firstElementChild; if (!ol) return;
  const H = innerHeight, uc = parseFloat(nav.parentElement.style.getPropertyValue('--uc')) || H * .01, start = 4.6 * uc, floor = Math.min(start, .038 * H), step = Math.max(.4, start * .04);
  const fits = () => ol.scrollWidth <= nav.clientWidth + 1 && nav.getBoundingClientRect().height <= .09 * H;
  nav.classList.remove('compact');
  for (const compact of [false, true]) {
    nav.classList.toggle('compact', compact);
    for (let px = start; px >= floor - .01; px -= step) { nav.style.setProperty('--thf', px + 'px'); if (fits()) return; }
  }
  nav.style.setProperty('--thf', floor + 'px');
}
function fitCaption(capEl, variants, uc) {
  const H = innerHeight, budget = .24 * H, start = 4.9 * uc, floor = Math.min(start, .042 * H), step = Math.max(.4, start * .03);
  for (const html of variants) {
    capEl.innerHTML = html;
    for (let px = start; px >= floor - .01; px -= step) { capEl.style.fontSize = px + 'px'; if (capEl.scrollHeight <= budget) return; }
  }
  capEl.style.fontSize = floor + 'px';
}

/* =====================================================================
   Figure d'un vote : question à gauche, 4 cartes lettrées à droite, barres de résultat, puis correction nommée
   ===================================================================== */
function voteFig(L, sc, S, X, P) {
  if (sc.vote.layout === 'gallery') return galleryFig(L, sc, S, X, P);
  const v = sc.vote, m = v.opts.length, tot = S.votes[sc.id] || new Array(m).fill(0), sum = tot.reduce((a, b) => a + b, 0), st = S.st;
  let out = '';
  /* gauche : figure de la scène ou, à défaut, la question en grand */
  if (v.draw) out += K.g(v.draw(st, X), {});
  else { const f = K.fit(v.qText ? v.qText(X) : t(key(L, sc, 'q')), 78, 6.4, 4); out += K.txtL(46, 34 - (f.lines.length - 1) * f.size * .65, f.lines, { size: f.size, lh: f.size * 1.3, w: 800, fixed: true }); }
  const ch = (66 - (m - 1) * 1.6) / m, x0 = 90, w = 68;
  /* d = position affichée (lettre), ci = index canonique de l'option (décomptes, journal, bilan) */
  P.forEach((ci, d) => {
    const o = v.opts[ci], y = 2 + d * (ch + 1.6), ok = o.ok, rev = st >= 2, dim = rev && !ok;
    const col = rev && ok ? K.C.green : K.C.ink;
    let c = K.rect(x0, y, w, ch, { fill: rev && ok ? '#e3f5ea' : K.C.paper, stroke: col, w: rev && ok ? 1 : .6, rx: 1.4 });
    c += K.badge(x0 + 5.2, y + ch / 2, LET[d], { r: 3.4, fill: col, size: 4.6 });
    const f = K.fitBox(v.label ? v.label(ci, X) : t(key(L, sc, 'o' + ci)), 37, ch - (st >= 1 ? 4.6 : 2.4), 4.2, 2);
    c += K.txtL(x0 + 10.5, y + ch / 2 - (f.lines.length - 1) * f.size * .58, f.lines, { size: f.size, lh: f.size * 1.16, anchor: 'start', w: 800, fixed: true });
    if (st >= 1) {
      const n = tot[ci] || 0, bw = sum ? (w - 3) * n / sum : 0;
      c += K.rect(x0 + 1.5, y + ch - 2.6, w - 3, 1.5, { fill: K.C.soft, rx: .7 }) + (bw ? K.rect(x0 + 1.5, y + ch - 2.6, bw, 1.5, { fill: rev ? (ok ? K.C.green : K.C.red) : K.C.blue, rx: .7 }) : '');
      c += K.txt(x0 + w - 14, y + ch / 2 - .4, String(n), { size: 5.4, anchor: 'end', w: 800 });
      const pre = S.pre && S.pre[sc.id], ps = pre ? pre.reduce((a, b) => a + b, 0) : 0;
      if (ps) c += K.rect(x0 + 1.5, y + ch - 1.05, (w - 3) * (pre[ci] || 0) / ps, .8, { fill: K.C.mute, rx: .4 });
    }
    if (rev) c += ok ? K.path(`M${x0 + w - 9.4} ${y + ch / 2 + .6}l2 2.2l4.2-5`, { stroke: K.C.green, w: 1.1 }) : K.path(`M${x0 + w - 9.2} ${y + ch / 2 - 1.7}l3.4 3.4M${x0 + w - 5.8} ${y + ch / 2 - 1.7}l-3.4 3.4`, { stroke: K.C.red, w: 1 });
    out += K.el('g', { 'data-vote': d, class: 'st-l-card' + (dim ? ' dim' : ''), role: 'button' }, c);
  });
  return out;
}
/* Vote « galerie » (v3.1, WP3) : le contexte (question, carte) à gauche — v.draw, dans x < 58 — et quatre options FIGURÉES en grille 2 × 2 à droite.
   Chaque mauvaise réponse est la figure du malentendu (v.optFig(c, box, X), calculée par le moteur) : le vote diagnostique et la salle voit pourquoi c'est faux.
   Une option = une lettre en gros + sa figure, SANS autre texte ; mêmes règles que les cartes (décompte, barre, ✓ / ✗, revote). d = lettre affichée, ci = option canonique. */
function galleryFig(L, sc, S, X, P) {
  const v = sc.vote, m = P.length, tot = S.votes[sc.id] || new Array(m).fill(0), sum = tot.reduce((a, b) => a + b, 0), st = S.st, rev = st >= 2, pre = S.pre && S.pre[sc.id], ps = pre ? pre.reduce((a, b) => a + b, 0) : 0;
  let out = K.g(v.draw(st, X), {});
  const cw = 48, chh = 32.5, x0 = 60, y0 = 2, gx = 2, gy = 1.5;
  P.forEach((ci, d) => {
    const o = v.opts[ci], ok = o.ok, col = rev && ok ? K.C.green : K.C.ink, x = x0 + (d % 2) * (cw + gx), y = y0 + (d >> 1) * (chh + gy), fb = { x: x + 1, y: y + 7.6, w: cw - 2, h: chh - 7.6 - 3.4 };
    let c = K.rect(x, y, cw, chh, { fill: rev && ok ? '#e3f5ea' : K.C.paper, stroke: col, w: rev && ok ? 1 : .6, rx: 1.4 });
    c += v.optFig(ci, fb, X);
    c += K.badge(x + 4.8, y + 4.4, LET[d], { r: 3.4, fill: col, size: 4.6 });
    if (st >= 1) {
      const n = tot[ci] || 0, bw = sum ? (cw - 3) * n / sum : 0;
      c += K.rect(x + 1.5, y + chh - 2.6, cw - 3, 1.5, { fill: K.C.soft, rx: .7 }) + (bw ? K.rect(x + 1.5, y + chh - 2.6, bw, 1.5, { fill: rev ? (ok ? K.C.green : K.C.red) : K.C.blue, rx: .7 }) : '');
      c += K.txt(x + cw - (rev ? 13 : 4), y + 4.4, String(n), { size: 5.4, anchor: 'end', w: 800, fixed: true });   // taille fixe : l'en-tête de la case n'a pas de marge (4:3 / salle)
      if (ps) c += K.rect(x + 1.5, y + chh - 1.05, (cw - 3) * (pre[ci] || 0) / ps, .8, { fill: K.C.mute, rx: .4 });
    }
    if (rev) c += ok ? K.path(`M${x + cw - 9.2} ${y + 4.8}l2 2.2l4.2-5`, { stroke: K.C.green, w: 1.1 }) : K.path(`M${x + cw - 9} ${y + 2.6}l3.4 3.4M${x + cw - 5.6} ${y + 2.6}l-3.4 3.4`, { stroke: K.C.red, w: 1 });
    const label = v.label ? v.label(ci, X) : t(key(L, sc, 'o' + ci));
    out += K.el('g', { 'data-vote': d, class: 'st-l-card' + (rev && !ok ? ' dimf' : ''), role: 'button', 'aria-label': `${LET[d]} : ${label}` }, c);
  });
  return out;
}
/* diagnostic : l'option fausse la plus choisie → malentendu NOMMÉ (ids de data/errors.js ou propres au Stage) */
function diagnosis(sc, S) {
  const tot = S.votes[sc.id] || [], opts = sc.vote.opts; let best = -1, bi = -1;
  opts.forEach((o, i) => { if (!o.ok && (tot[i] || 0) > best) { best = tot[i] || 0; bi = i; } });
  return best > 0 ? { i: bi, id: opts[bi].mis, n: best } : null;
}

/* =====================================================================
   PROJECTION
   ===================================================================== */
export function mountLesson(root, id, arg) {
  const L = lessonById(id); if (!L) return lessonIndex(root);
  if (arg === 'presenter') return mountPresenter(root, L);
  const prefs = loadPrefs(); setLang(prefs.lang || 'fr');
  const S = { pre: {}, sc: Math.max(0, Math.min(L.scenes.length - 1, (+arg || 1) - 1)), st: 0, pi: 0, rs: prefs.rs || 1, theme: prefs.theme || 'light', seed: prefs.seed || L.seed || 12, votes: {}, hint: !!prefs.hint, blank: false, help: false, fwd: true, tEnd: 0, tTot: 0 };
  document.body.classList.add('stage-on');
  const el = h('div', { class: 'stg st-l' + (L.thread ? ' has-thread' : ''), 'data-theme': S.theme });
  el.innerHTML = `<header class="st-l-top"><span class="st-l-kind" id="lKind"></span><h1 class="st-l-claim" id="lClaim"></h1><span class="st-l-n" id="lN"></span></header>
   <main class="st-l-fig" id="lFig"><svg id="lSvg" viewBox="0 0 ${K.W} ${K.H}" preserveAspectRatio="xMidYMid meet" role="img"></svg><div class="st-l-ov" id="lOv"></div></main>
   <footer class="st-l-cap"><p class="st-l-text" id="lCap" aria-live="polite"></p><div class="st-l-side" id="lSide"></div></footer>
   <nav class="st-l-thread" id="lThread" aria-label="${esc(t('th.aria'))}" data-draft="${L.thread ? 'true' : ''}"></nav>
   <nav class="st-l-rail" id="lRail" aria-label="${esc(t('lk.rail'))}"></nav>
   <div class="st-l-tools" id="lTools"></div><div class="st-l-blank" id="lBlank"></div><div class="st-l-help" id="lHelp" role="dialog"></div>
   <div class="st-l-test" id="lTest" role="dialog"><h2>${t('lk.test.title')}</h2><p class="st-l-tp">${t('lk.test.how')}</p>
    <div class="st-l-trow"><b>A</b><span style="font-size:calc(var(--u)*3.4)">${t('lk.test.a')} — Éq = 40 m · 720 m · 640 m</span></div>
    <div class="st-l-trow"><b>B</b><span style="font-size:calc(var(--u)*4.9)">${t('lk.test.b')} — Éq = 40 m</span></div>
    <div class="st-l-trow"><b>C</b><span style="font-size:calc(var(--u)*7)">${t('lk.test.c')} 720 m</span></div>
    <p class="st-l-tp" id="lTestRs"></p></div>`;
  root.append(el);
  const $ = s => el.querySelector(s);
  const ctxCache = new Map(), ctx = () => { const k = S.seed; if (!ctxCache.has(k)) ctxCache.set(k, L.setup ? L.setup(k) : {}); return ctxCache.get(k); };
  const nS = () => stepsOf(L.scenes[S.sc], ctx());
  const orderOf = sc => optionOrder(sc.vote.opts.length, L.id + '.' + sc.id, S.seed, !!sc.vote.fixed);
  let ch = null; try { ch = new BroadcastChannel('gc-stage-L-' + L.id); } catch (e) { }
  const TOOLS = [['prev', 'lk.prev', '←'], ['next', 'lk.next', '→'], '|', ['minus', 'lk.smaller', '−'], ['plus', 'lk.bigger', '+'], ['theme', 'lk.theme', 'T'], ['blank', 'lk.blank', 'B'], ['full', 'lk.full', 'F'], ['present', 'lk.present', 'P'], ['help', 'lk.help', 'H'], ['exit', 'lk.exit', 'Esc']];
  $('#lTools').innerHTML = TOOLS.map(x => x === '|' ? '<i class="st-sep"></i>' : `<button class="st-b" data-act="${x[0]}" aria-label="${esc(t(x[1]))}" title="${esc(t(x[1]))} (${x[2]})">${ic(ICON[x[0]])}</button>`).join('');
  $('#lRail').innerHTML = L.scenes.map((s, i) => `<button class="st-l-dot" data-go="${i}" data-kind="${s.kind}" aria-label="${esc(t(key(L, s, 'claim')))}">${kindIc(s.kind)}</button>`).join('');
  $('#lHelp').innerHTML = `<div class="st-l-hbox"><h2>${t('lk.helpTitle')}</h2>${['→ / Espace|lk.h.next', '←|lk.h.prev', '↑ ↓|lk.h.param', 'A B C D|lk.h.vote', 'B|lk.h.blank', 'T|lk.h.theme', '+ −|lk.h.size', 'R|lk.h.revote', 'I|lk.h.hint', 'N|lk.h.regen', 'K|lk.h.test', 'F · P · Échap|lk.h.misc'].map(r => { const [k, v] = r.split('|'); return `<div class="st-l-hrow"><kbd>${k}</kbd><span>${t(v)}</span></div>`; }).join('')}</div>`;

  const post = () => ch && ch.postMessage({ t: 'state', S: { sc: S.sc, st: S.st, pi: S.pi, seed: S.seed, votes: S.votes, pre: S.pre, steps: nS() } });
  let timerI = 0;

  function render() {
    const sc = L.scenes[S.sc], cx = ctx(), n = nS(), pv = paramOf(sc, S.pi);
    S.st = Math.max(0, Math.min(S.st, n - 1));
    const uc = chromeUnit(unitPx(S.rs), unitPx(1), innerWidth);
    el.dataset.theme = S.theme; el.style.setProperty('--u', unitPx(S.rs) + 'px'); el.style.setProperty('--uc', uc + 'px');
    K.room(S.rs, innerWidth / innerHeight); K.direction(S.fwd);
    const X = { t, nf, ctx: cx, pi: S.pi, seed: S.seed, rs: S.rs, scene: sc, lesson: L };
    /* vote : perm = ordre d'affichage ; X.letterOf(c) = lettre montrée à la salle pour l'option canonique c (pour les figures lettrées) */
    const P = sc.kind === 'vote' ? orderOf(sc) : null, inv = P && invertOrder(P);
    if (P) { X.perm = P; X.letterOf = c => LET[inv[c]]; }
    let inner = '';
    if (sc.kind === 'vote') inner = voteFig(L, sc, S, X, P); else if (sc.fig) inner = sc.fig(S.st, pv, X);
    $('#lSvg').innerHTML = inner;
    $('#lSvg').setAttribute('aria-label', t(key(L, sc, 'claim')));
    $('#lKind').innerHTML = `${kindIc(sc.kind)}<span>${t('kind.' + sc.kind)}</span>`; $('#lKind').dataset.kind = sc.kind;
    $('#lClaim').textContent = t(key(L, sc, 'claim'));
    $('#lN').textContent = `${S.sc + 1} / ${L.scenes.length}`;
    fitClaim($('#lClaim'), uc);
    $('#lTestRs').textContent = t('lk.test.rs', { rs: nf(S.rs, 2) });
    /* légende */
    let cap = '';
    if (sc.cap) { const r = sc.cap(S.st, pv, X); cap = r ? t(r[0], r[1]) : ''; } else { const k = capKey(L, sc, S.st); cap = k ? t(k, sc.capVars ? sc.capVars(S.st, pv, X) : undefined) : ''; }
    /* variantes de la légende, de la plus complète à la plus courte (fitCaption retient la première qui tient) */
    let capVariants;
    if (sc.kind === 'vote' && S.st >= 2) {
      const d = diagnosis(sc, S), ok = sc.vote.opts.findIndex(o => o.ok);
      const head = `<b class="st-l-ok">${LET[inv[ok]]} — ${sc.vote.solText ? sc.vote.solText(X) : t(key(L, sc, 'sol'))}</b>`;
      const mis = why => `<span class="st-l-mis"><b>${LET[inv[d.i]]}</b> (${d.n}) · ${t('mis.' + d.id)}${why ? ' — ' + t('mis.' + d.id + '.why') : ''}</span>`;
      capVariants = d ? [head + mis(true), head + mis(false)] : [head];
    } else if (S.hint && sc.kind === 'vote' && S.st === 1 && mazur(S.votes[sc.id], sc.vote.opts.findIndex(o => o.ok))) {
      /* indication enseignant, courte et grosse (touche I) ; la version complète est dans la vue présentateur */
      const mz = mazur(S.votes[sc.id], sc.vote.opts.findIndex(o => o.ok));
      capVariants = [`<b>${mz.pct} %</b> · ${esc(t('pi.s.' + mz.band))}`];
    } else capVariants = [esc(cap).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')];
    /* panneau latéral : paramètre ↑↓, minuteur */
    let side = '';
    if (sc.param) side += `<div class="st-l-par"><button class="st-b" data-act="pdn" aria-label="−">${ic(ICON.down)}</button><span class="st-l-pv">${esc(sc.param.label(pv, S.pi, X))}</span><button class="st-b" data-act="pup" aria-label="+">${ic(ICON.up)}</button></div>`;
    if (sc.kind === 'vote' && S.st >= 1) { const sum = (S.votes[sc.id] || []).reduce((a, b) => a + b, 0); side += `<div class="st-l-tally">${t('lk.votes', { n: sum })}</div>`; }
    if (sc.practice) side += `<div class="st-l-timer" id="lTimer"><i></i><b></b></div>`;
    $('#lSide').innerHTML = side;
    fitCaption($('#lCap'), capVariants, uc);
    /* superposition HTML : exercice du moteur */
    const ov = $('#lOv'); ov.innerHTML = ''; ov.className = 'st-l-ov';
    if (sc.practice && sc.practice.ch) {
      const ex = exoFor(sc, S.seed);
      let b = `<div class="st-l-prq">${safeHtml(ex.prompt).replace(/<b>/g, '<b class="st-l-hl">')}</div>`;
      if (ex.choices) b += `<div class="st-l-pro">${ex.choices.o.map((o, i) => `<div class="st-l-po${S.st >= 2 ? (i === ex.choices.a ? ' ok' : ' dim') : ''}"><b>${LET[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>`;
      else if (S.st >= 2) b += `<div class="st-l-pra">${ex.fields.map(f => `<div>${esc(fmtAns(f))}</div>`).join('')}</div>`;
      if (S.st >= 2 && ex.sol && words(ex.sol) <= 30) b += `<div class="st-l-sol">${esc(safeHtml(ex.sol).replace(/<[^>]*>/g, ''))}</div>`;
      ov.innerHTML = b; ov.classList.add('on');
    }
    /* rail */
    const kinds = L.scenes.map(s => s.kind), run = passiveRun(kinds, S.sc, K.ACTIVE);
    el.querySelectorAll('.st-l-dot').forEach((d, i) => { d.classList.toggle('on', i === S.sc); d.classList.toggle('dn', i < S.sc); });
    $('#lRail').classList.toggle('warn', run >= 4);
    if (L.thread) { const th = $('#lThread'); th.innerHTML = threadHtml(L, sc); th.classList.toggle('warn', run >= 4); fitThread(th); }
    /* timer */
    clearInterval(timerI);
    if (sc.practice) {
      if (S.st === 1 && !S.tEnd) { S.tTot = sc.practice.seconds || 120; S.tEnd = Date.now() + S.tTot * 1000; }
      if (S.st !== 1) S.tEnd = S.st === 0 ? 0 : S.tEnd;
      const tick = () => { const T = $('#lTimer'); if (!T) return; const left = S.st === 1 && S.tEnd ? (S.tEnd - Date.now()) / 1000 : (S.st === 0 ? (sc.practice.seconds || 120) : 0);
        T.querySelector('b').textContent = fmtClock(left); T.style.setProperty('--p', S.st === 1 && S.tTot ? Math.max(0, left / S.tTot) : S.st === 0 ? 1 : 0); T.classList.toggle('end', S.st === 1 && left <= 0); };
      tick(); timerI = setInterval(tick, 250);
    } else S.tEnd = 0;
    el.querySelector('#lFig').classList.remove('st-l-swap'); void el.offsetWidth; if (S.swap) { el.querySelector('#lFig').classList.add('st-l-swap'); S.swap = false; }
    try { history.replaceState(null, '', `#/stage/${L.id}/${S.sc + 1}`); } catch (e) { }
    post();
  }
  const go = (sc, st) => { S.fwd = sc > S.sc || (sc === S.sc && st >= S.st); if (sc !== S.sc) { S.swap = true; S.pi = L.scenes[sc].param?.start || 0; S.tEnd = 0; } S.sc = sc; S.st = st; render(); };
  const next = () => { const n = nS(); if (S.st < n - 1) go(S.sc, S.st + 1); else if (S.sc < L.scenes.length - 1) go(S.sc + 1, 0); else { location.hash = '#/stage'; } };
  const prev = () => { if (S.st > 0) go(S.sc, S.st - 1); else if (S.sc > 0) { const p = S.sc - 1; go(p, stepsOf(L.scenes[p], ctx()) - 1); } };
  const param = d => { const sc = L.scenes[S.sc]; if (!sc.param) return; const n = sc.param.values.length; S.pi = (S.pi + d + n) % n; S.fwd = true; render(); };
  /* i = lettre affichée (touche a–d, clic, présentateur) ; le décompte est tenu en ordre canonique */
  const vote = (i, d = 1) => { const sc = L.scenes[S.sc]; if (sc.kind !== 'vote' || i >= sc.vote.opts.length) return; const c = orderOf(sc)[i]; const a = S.votes[sc.id] || (S.votes[sc.id] = new Array(sc.vote.opts.length).fill(0)); a[c] = Math.max(0, a[c] + d); if (S.st === 0) S.st = 1; S.fwd = false; render(); };
  const logIt = () => { const sc = L.scenes[S.sc]; if (sc.kind === 'vote') logVote({ lesson: L.id, scene: sc.id, votes: S.votes[sc.id] || [], pre: S.pre[sc.id] || null, ok: sc.vote.opts.findIndex(o => o.ok) }); };
  /* R : 1er tour terminé → on garde l'ancien tally en « avant » (barre grise) et on repart de zéro pour le revote après discussion */
  const revote = () => { const sc = L.scenes[S.sc]; if (sc.kind !== 'vote' || S.st !== 1 || S.pre[sc.id]) return; const cur = S.votes[sc.id]; if (!cur || !cur.some(Boolean)) return; S.pre[sc.id] = cur.slice(); S.votes[sc.id] = new Array(cur.length).fill(0); S.fwd = false; render(); };
  const act = a => {
    if (a === 'prev') prev(); else if (a === 'next') { if (L.scenes[S.sc].kind === 'vote' && S.st === 1) logIt(); next(); }
    else if (a === 'hint') { S.hint = !S.hint; savePrefs({ hint: S.hint }); render(); }
    else if (a === 'revote') revote(); else if (a === 'pup') param(1); else if (a === 'pdn') param(-1);
    else if (a === 'blank') { S.blank = !S.blank; $('#lBlank').classList.toggle('on', S.blank); }
    else if (a === 'theme') { S.theme = S.theme === 'light' ? 'dark' : 'light'; savePrefs({ theme: S.theme }); render(); }
    else if (a === 'plus' || a === 'minus') { S.rs = Math.round(Math.min(2.5, Math.max(.8, S.rs + (a === 'plus' ? .1 : -.1))) * 100) / 100; savePrefs({ rs: S.rs }); render(); }
    else if (a === 'regen') { if (L.setup) { S.seed = S.seed + 1; savePrefs({ seed: S.seed }); S.st = 0; render(); } }
    else if (a === 'full') { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) { } }
    else if (a === 'present') window.open(location.href.replace(/#.*$/, '') + '#/stage/' + L.id + '/presenter', 'gc-stage-pv', 'popup,width=1100,height=760');
    else if (a === 'help') { S.help = !S.help; $('#lHelp').classList.toggle('on', S.help); }
    else if (a === 'test') { S.test = !S.test; $('#lTest').classList.toggle('on', S.test); render(); }
    else if (a === 'exit') location.hash = '#/stage';
  };
  el.addEventListener('click', e => {
    const c = e.target.closest('[data-vote]'); if (c) { vote(+c.dataset.vote, e.shiftKey ? -1 : 1); return; }
    const b = e.target.closest('[data-act]'); if (b) { act(b.dataset.act); return; }
    const d = e.target.closest('[data-go]'); if (d) { go(+d.dataset.go, 0); return; }
    if (S.test) { act('test'); return; }
    if (S.help) { act('help'); return; }
    if (S.blank) { act('blank'); return; }
    if (e.target.closest('.st-l-top,.st-l-rail,.st-l-tools')) return;
    const r = el.getBoundingClientRect(); (e.clientX - r.left) < r.width * .2 ? prev() : act('next');
  });
  const onKey = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const vi = 'abcd'.indexOf(e.key.toLowerCase()), vn = '1234'.indexOf(e.key);
    if (L.scenes[S.sc].kind === 'vote' && (vi >= 0 || vn >= 0)) { e.preventDefault(); vote(vi >= 0 ? vi : vn, e.shiftKey ? -1 : 1); return; }
    if (e.key === 'Home') { go(0, 0); return; } if (e.key === 'End') { go(L.scenes.length - 1, 0); return; }
    const a = KEYS[e.key]; if (!a) return;
    if (a === 'exit' && S.test) { act('test'); return; } if (a === 'exit' && S.help) { act('help'); return; } if (a === 'exit' && S.blank) { act('blank'); return; }
    e.preventDefault(); act(a);
  };
  addEventListener('keydown', onKey);
  const beat = setInterval(() => post(), BEAT);   // rc.5 : présence pour la vue enseignant (aucun effet à l'écran)
  let idleT = 0; el.addEventListener('pointermove', () => { el.classList.add('act'); clearTimeout(idleT); idleT = setTimeout(() => el.classList.remove('act'), 2600); });
  const onResize = () => render(); addEventListener('resize', onResize);
  if (ch) ch.onmessage = ev => { const m = ev.data; if (m.t === 'hello') post(); else if (m.t === 'cmd') { if (m.a === 'goto') go(m.v, 0); else if (m.a === 'home') go(0, 0); else if (m.a === 'end') go(L.scenes.length - 1, 0); else if (m.a === 'vote') vote(m.v); else if (m.a === 'unvote') vote(m.v, -1); else act(m.a); } };
  render();
  return () => { document.body.classList.remove('stage-on'); clearInterval(timerI); clearInterval(beat); removeEventListener('keydown', onKey); removeEventListener('resize', onResize); ch && ch.close(); el.remove(); };
}

/* =====================================================================
   PRÉSENTATEUR : notes, question à poser, votes, minuteur, commandes — sur l'écran de l'enseignant
   ===================================================================== */
/* touches de la projection, partagées avec le présentateur (rc.5) : la fenêtre enseignant RELAIE les mêmes touches à la projection.
   Ne sont pas relayées : quitter, plein écran (exige un geste dans la fenêtre de projection), aide (s'afficherait aux étudiants), présentateur. */
const KEYS = { ArrowRight: 'next', PageDown: 'next', ' ': 'next', Enter: 'next', ArrowLeft: 'prev', PageUp: 'prev', Backspace: 'prev', ArrowUp: 'pup', ArrowDown: 'pdn', b: 'blank', B: 'blank', '.': 'blank', t: 'theme', T: 'theme', '+': 'plus', '=': 'plus', '-': 'minus', _: 'minus', n: 'regen', N: 'regen', f: 'full', F: 'full', p: 'present', P: 'present', h: 'help', H: 'help', '?': 'help', k: 'test', K: 'test', r: 'revote', i: 'hint', I: 'hint', R: 'revote', Escape: 'exit' };
const NO_RELAY = new Set(['exit', 'full', 'help', 'present']);
const BEAT = 2000, LOST = 5500;                                   // la projection signale sa présence toutes les 2 s ; muette 5,5 s = perdue
export const projUrl = (id, sc = 1) => location.href.replace(/#.*$/, '') + '#/stage/' + id + '/' + sc;
export const presUrl = id => location.href.replace(/#.*$/, '') + '#/stage/' + id + '/presenter';

function mountPresenter(root, L) {
  setLang(loadPrefs().lang || 'fr');
  document.body.classList.add('stage-pv');
  const S = { sc: 0, st: 0, steps: 1, votes: {} }; let live = false, seen = 0, t0 = Date.now(), ts = Date.now(), last = -1;
  const el = h('div', { class: 'pv' }); root.append(el);
  el.innerHTML = `<h1>${esc(t(L.title))}</h1>${L.draft ? `<p class="pv-warn">${esc(t('th.draft'))}</p>` : ''}<div class="pv-bar"><p class="pv-status" id="pvStat" role="status" aria-live="polite"></p><button class="pv-b pv-open" data-local="open">${esc(t('pres.openStage'))}</button></div>
   <div class="pv-guide" id="pvGuide" hidden><b>${esc(t('pres.g.h'))}</b><ol><li>${esc(t('pres.g.1'))}</li><li>${esc(t('pres.g.2'))}</li><li>${esc(t('pres.g.3'))}</li></ol><button class="pv-b" data-local="guide">${esc(t('pres.g.ok'))}</button></div>
   <div class="pv-nav"><button class="pv-b pv-big" data-a="prev" aria-keyshortcuts="ArrowLeft">◀ ${esc(t('lk.prev'))}</button><span class="pv-pos" id="pvPos"></span><button class="pv-b pv-big pv-next" data-a="next" aria-keyshortcuts="ArrowRight">${esc(t('lk.next'))} ▶</button></div>
   <div class="pv-grid"><section class="pv-main"><div class="pv-scene" id="pvScene"></div>
   <div class="pv-card"><h3>${t('pres.note')}${L.thread || L.draft ? ' <small class="pv-dr">· ' + esc(t('th.draft')) + '</small>' : ''}</h3><p id="pvNote"></p></div><div class="pv-card ask"><h3>${t('pres.question')}</h3><p id="pvAsk"></p></div><div class="pv-card" id="pvVotes"></div><div class="pv-card"><h3>${t('pres.next')}</h3><p id="pvNext"></p></div></section>
   <section class="pv-side"><div class="pv-card"><h3>${t('pres.timer')}</h3><p class="pv-time"><b id="pvT"></b> · ${t('pres.sceneTimer')} <b id="pvTs"></b></p></div>
   <div class="pv-card"><h3>${t('pres.controls')}</h3><div class="pv-btns">${[['prev', t('lk.prev')], ['next', t('lk.next')], ['pdn', '−'], ['pup', '+'], ['regen', t('lk.regen')], ['blank', t('lk.blank')]].map(([a, l]) => `<button class="pv-b" data-a="${a}">${esc(l)}</button>`).join('')}</div>
   <div class="pv-btns">${[0, 1, 2, 3].map(i => `<button class="pv-b" data-a="vote" data-v="${i}">+ ${LET[i]}</button>`).join('')}<button class="pv-b" data-a="revote">${t('pi.revote')}</button></div><div id="pvPi"></div></div>
   <div class="pv-card pv-keys"><h3>${esc(t('pres.keys'))}</h3><p>${esc(t('pres.keys.d'))}</p></div>
   <div class="pv-card"><h3>${t('pres.scenes')}</h3><div class="pv-list" id="pvList">${L.scenes.map((s, i) => `<button class="pv-b l" data-a="goto" data-v="${i}">${i + 1}. ${esc(t(key(L, s, 'claim')))}</button>`).join('')}</div></div></section></div>`;
  const $ = s => el.querySelector(s);
  let ch = null; try { ch = new BroadcastChannel('gc-stage-L-' + L.id); } catch (e) { }
  const send = (a, v) => ch && ch.postMessage({ t: 'cmd', a, v });
  const openProj = () => window.open(projUrl(L.id, S.sc + 1), 'gc-stage-proj', 'popup,width=1280,height=760');
  el.addEventListener('click', e => { const loc = e.target.closest('[data-local]'); if (loc) { if (loc.dataset.local === 'open') openProj(); else { $('#pvGuide').hidden = true; try { sessionStorage.removeItem('gc_dual'); } catch (er) { } } return; }
    const b = e.target.closest('[data-a]'); if (b) send(b.dataset.a, b.dataset.v != null ? +b.dataset.v : undefined); });
  /* rc.5 : les touches de la projection fonctionnent aussi ICI (télécommande de présentation, clavier de l'enseignant) et sont relayées */
  const onKey = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const vi = 'abcd'.indexOf(e.key.toLowerCase()), vn = '1234'.indexOf(e.key), sc = L.scenes[S.sc];
    if (sc && sc.kind === 'vote' && (vi >= 0 || vn >= 0)) { e.preventDefault(); send(e.shiftKey ? 'unvote' : 'vote', vi >= 0 ? vi : vn); return; }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); send(e.key === 'Home' ? 'home' : 'end'); return; }
    const a = KEYS[e.key]; if (!a || NO_RELAY.has(a)) return; e.preventDefault(); send(a);
  };
  addEventListener('keydown', onKey);
  /* malentendu dominant : la mauvaise réponse la plus choisie, avec sa correction (guide de remédiation, pas de texte propre à la scène) */
  const domMis = (sc, v) => { const tot = v || [], ok = sc.vote.opts.findIndex(o => o.ok); let b = -1; sc.vote.opts.forEach((o, i) => { if (i !== ok && o.mis && (tot[i] || 0) > 0 && (b < 0 || tot[i] > tot[b])) b = i; }); if (b < 0) return ''; const id = sc.vote.opts[b].mis; return has('mis.' + id) ? `<div class="pv-dom"><b>${esc(t('pres.dom'))}</b> : ${esc(t('mis.' + id))}${has('mis.' + id + '.why') ? ' — ' + esc(t('mis.' + id + '.why')) : ''}</div>` : ''; };
  const draw = () => {
    const sc = L.scenes[S.sc]; if (S.sc !== last) { ts = Date.now(); last = S.sc; }
    const tn = threadNote(L, sc);
    $('#pvPos').textContent = t('pres.pos', { a: S.sc + 1, b: L.scenes.length, c: S.st + 1, d: S.steps || 1 });
    $('#pvScene').innerHTML = `<span class="pv-no">${S.sc + 1}</span><div><h2>${esc(t(key(L, sc, 'claim')))}</h2><p>${t('kind.' + sc.kind)} · ${t('lk.step', { a: S.st + 1, b: S.steps })}</p>${tn ? `<p class="pv-th">${esc(tn)}</p>` : ''}</div>`;
    $('#pvNote').textContent = has(key(L, sc, 'note')) ? t(key(L, sc, 'note')) : '—'; $('#pvAsk').textContent = has(key(L, sc, 'ask')) ? t(key(L, sc, 'ask')) : '—';
    const nx = L.scenes[S.sc + 1]; $('#pvNext').textContent = nx ? t(key(L, nx, 'claim')) : '—';
    el.querySelectorAll('#pvList .pv-b').forEach((b, i) => b.classList.toggle('on', i === S.sc));
    const v = S.votes[sc.id]; $('#pvVotes').style.display = sc.kind === 'vote' ? '' : 'none';
    if (sc.kind === 'vote') { const sum = (v || []).reduce((a, b) => a + b, 0) || 1; $('#pvVotes').innerHTML = `<h3>${t('lk.votes', { n: (v || []).reduce((a, b) => a + b, 0) })}</h3>` + ((m) => m ? `<div class="st-l-pi pi-${m.band}"><b>${m.pct} %</b> ${t('pi.' + m.band)}</div>` : '')(mazur(v, sc.vote.opts.findIndex(o => o.ok))) + domMis(sc, v) + optionOrder(sc.vote.opts.length, L.id + '.' + sc.id, S.seed, !!sc.vote.fixed).map((c, d) => `<div class="pv-bar"><b>${LET[d]}</b><i style="width:${Math.round(100 * ((v || [])[c] || 0) / sum)}%"></i><span>${(v || [])[c] || 0}</span></div>`).join(''); }
  };
  /* état de la liaison : synchronisé (signal reçu il y a moins de 5,5 s), perdu (projection fermée ou rechargée ailleurs), en attente (jamais vue) */
  const stat = () => { const ok = live && Date.now() - seen < LOST, lost = live && !ok;
    $('#pvStat').textContent = ok ? '🟢 ' + t('pres.connected') : lost ? '🔴 ' + t('pres.lost') : '🟠 ' + t('pres.waiting'); $('#pvStat').className = 'pv-status ' + (ok ? 'ok' : lost ? 'ko' : 'wait');
    $('.pv-open').hidden = ok; el.classList.toggle('pv-off', !ok); };
  if (ch) ch.onmessage = ev => { const m = ev.data; if (m.t === 'state') { Object.assign(S, m.S); live = true; seen = Date.now(); stat(); draw(); } };
  const fmt = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const tick = setInterval(() => { $('#pvT').textContent = fmt(Date.now() - t0); $('#pvTs').textContent = fmt(Date.now() - ts); stat(); }, 500);
  draw(); stat(); ch && ch.postMessage({ t: 'hello' });
  try { if (sessionStorage.getItem('gc_dual') === L.id) $('#pvGuide').hidden = false; } catch (er) { }
  if (!ch || location.protocol === 'file:') el.insertBefore(h('p', { class: 'pv-warn' }, t('pres.noSync')), el.children[2]);
  return () => { document.body.classList.remove('stage-pv'); clearInterval(tick); removeEventListener('keydown', onKey); ch && ch.close(); el.remove(); };
}

/* =====================================================================
   INDEX : les 11 thèmes du TP, dans l'ordre du cours
   ===================================================================== */
/* rc.5 : « projection + vue enseignant » en un clic. Un clic n'autorise qu'UNE fenêtre surgissante : la projection s'ouvre à part,
   la vue enseignant prend l'onglet courant (où l'enseignant travaille). Si la fenêtre est bloquée, le bouton « Ouvrir la projection » reste là. */
const dualCard = (card, id, sc) => `<div class="st-ix-w">${card}<button class="st-ix-dual" data-dual="${id}" data-sc="${sc}" title="${esc(t('ix.dual'))}" aria-label="${esc(t('ix.dual'))}">🎙️<span>${esc(t('ix.dual.s'))}</span></button></div>`;
export function lessonIndex(root) {
  setLang(loadPrefs().lang || 'fr');
  root.onclick = e => { const b = e.target.closest('[data-dual]'); if (!b) return; e.preventDefault(); const id = b.dataset.dual;
    window.open(projUrl(id, +b.dataset.sc), 'gc-stage-proj', 'popup,width=1280,height=760'); try { sessionStorage.setItem('gc_dual', id); } catch (er) { } location.hash = '#/stage/' + id + '/presenter'; };
  const cards = TOPICS.map(tp => {
    const L = tp.id ? lessonById(tp.id) : null;
    const min = L ? (tp.scene ? 0 : L.scenes.reduce((a, s) => a + (s.min || 2), 0)) : 0;
    const href = L && !L.planned ? `#/stage/${L.id}${tp.scene ? '/' + tp.scene : ''}` : tp.legacy ? `#/stage/${tp.legacy.deck}/${tp.legacy.scene}` : null;
    const state = L && !L.planned ? 'v2' : tp.legacy ? 'v1' : 'plan';
    const inner = `<span class="st-ix-n">${tp.n}</span><span class="st-ix-b"><b>${esc(t('topic.' + tp.n))}</b><small>${esc(t('topic.' + tp.n + '.d'))}</small></span><span class="st-ix-s st-ix-${state}">${t('ix.' + state)}${min ? ` · ${min} min` : ''}</span>`;
    return !href ? `<div class="st-ix-c off">${inner}</div>` : state === 'v2' ? dualCard(`<a class="st-ix-c" href="${href}">${inner}</a>`, L.id, tp.scene || 1) : `<a class="st-ix-c" href="${href}">${inner}</a>`;
  }).join('');
  const pro = lessonById('mission'), proCard = pro ? dualCard(`<a class="st-ix-c st-ix-pro" href="#/stage/mission"><span class="st-ix-n">0</span><span class="st-ix-b"><b>${esc(t('ix.pro'))}</b><small>${esc(t('ix.pro.d'))}</small></span><span class="st-ix-s st-ix-v2">${t('ix.v2')} · ${pro.scenes.reduce((a, s) => a + (s.min || 2), 0)} min</span></a>`, 'mission', 1) : '';
  const pre = lessonById('prereq'), preCard = pre ? dualCard(`<a class="st-ix-c st-ix-pro" href="#/stage/prereq"><span class="st-ix-n">↺</span><span class="st-ix-b"><b>${esc(t('ix.pre'))}</b><small>${esc(t('ix.pre.d'))}</small></span><span class="st-ix-s st-ix-v2">${esc(t('ix.draftShort'))} · ${pre.scenes.reduce((a, s) => a + (s.min || 2), 0)} min</span></a>`, 'prereq', 1) : '';
  root.innerHTML = `<h1>🎞️ ${t('ix.title')}</h1><p class="lead">${t('ix.lead')}</p><div class="st-ix">${proCard}${preCard}${cards}</div>
   <div class="box tip"><b class="t">💡</b>${t('ix.tip')}</div>
   <p class="st-ix-dualhelp">${esc(t('ix.dual.d'))}</p>
   <p><a class="btn" href="#/stage/courbes/presenter">${t('ix.v1pres')}</a> <a class="btn" href="#/stage/fil">${t('th.title')}</a> <a class="btn" href="#/stage/lib">${t('lib.title')}</a> <a class="btn" href="#/stage/bilan">${t('bilan.title')}</a></p>`;
}
