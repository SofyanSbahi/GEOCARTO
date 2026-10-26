/* Kit de scène « dernier rang » : un petit DSL SVG où TOUTE taille est exprimée dans un repère logique 160 × 70
   (≈ la zone de figure d'un écran 16:9, indépendante de la résolution du projecteur).
   Garde-fous intégrés : texte jamais sous MIN unités (≈ 3,8 % de la hauteur d'écran), traits jamais sous 0,35, halo blanc sous les chiffres,
   densité adaptée à la salle (les éléments « lo » disparaissent en amphithéâtre). */
export const W = 160, H = 70;
export const MIN = 3.4;          // taille minimale de texte (unités logiques) ≈ 3,8 % de la hauteur d'écran
export const MIN_STROKE = .35;
export const C = {               // palette sûre pour le daltonisme : chaque couleur est doublée d'une forme / d'un style
  ink: '#111418', mute: '#4a5560', paper: '#ffffff', soft: '#eef1f4', line: '#c9d0d6',
  acc: '#d2461e', pri: '#0b5c4c', blue: '#1b62c4', brown: '#8a4313', gold: '#f2b705', green: '#1f8f4e', red: '#c6283a', purple: '#7b3fb4'
};
let K = { fs: 1, amphi: false, small: false, narrow: false, fwd: true };
/* rs = facteur de salle ; aspect = largeur/hauteur de l'écran. Un écran 4:3 ou 16:10 réduit la figure (limitée par la largeur) : le texte est compensé,
   et les détails secondaires disparaissent (comme en amphi), pour que le texte reste ≥ 3,4 u mesuré en % de la hauteur d'écran. */
export const room = (rs, aspect = 16 / 9) => { const comp = Math.min(1.35, Math.max(1, (16 / 9) / aspect)); K = { ...K, fs: Math.pow(Math.min(1.5, Math.max(.9, rs)), .5) * comp, amphi: rs >= 1.3, small: rs < 1.05, narrow: aspect < 1.6 }; };
export const direction = fwd => { K = { ...K, fwd }; };
export const isAmphi = () => K.amphi || K.narrow;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const attrs = o => Object.entries(o || {}).filter(([, v]) => v != null && v !== false).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
export const el = (tag, a, inner = '') => `<${tag} ${attrs(a)}>${inner}</${tag}>`;
const r2 = n => Math.round(n * 100) / 100;

/* texte : size en unités logiques ; halo blanc par défaut ; o.fixed = ne pas adapter à la salle */
export function txt(x, y, s, o = {}) {
  const base = Math.max(MIN, o.size || 4), size = base * (o.fixed || base >= 8 ? 1 : K.fs);  /* les grands chiffres (≥ 8 u) ne grossissent pas : ils sont déjà lisibles de loin */
  return el('text', {
    x: r2(x), y: r2(y), class: 'st-t' + (o.cls ? ' ' + o.cls : '') + (o.halo === false ? ' nh' : '') + (size >= 6 && o.halo !== false ? ' fp' : ''), 'font-size': r2(size), 'font-weight': o.w || 700,
    'text-anchor': o.anchor || 'middle', style: `fill:${o.fill || C.ink}`, transform: o.rot ? `rotate(${o.rot} ${r2(x)} ${r2(y)})` : null, 'dominant-baseline': o.base || 'central'
  }, esc(s).replace(/\n/g, ''));
}
/* texte multiligne : lines = ['a','b'] */
export const txtL = (x, y, lines, o = {}) => { const lh = (o.lh || (o.size || 4) * 1.25) * (o.fixed || (o.size || 4) >= 8 ? 1 : K.fs); return lines.map((l, i) => txt(x, y + i * lh, l, o)).join(''); };
export const fsz = () => K.fs;
export const line = (x1, y1, x2, y2, o = {}) => el('line', { x1: r2(x1), y1: r2(y1), x2: r2(x2), y2: r2(y2), stroke: o.c || C.ink, 'stroke-width': Math.max(MIN_STROKE, o.w || .5), 'stroke-dasharray': o.dash, 'stroke-linecap': o.cap || 'round', opacity: o.op, class: o.cls });
export const rect = (x, y, w, h, o = {}) => el('rect', { x: r2(x), y: r2(y), width: r2(w), height: r2(h), rx: o.rx, fill: o.fill || 'none', stroke: o.stroke, 'stroke-width': o.stroke ? Math.max(MIN_STROKE, o.w || .5) : null, opacity: o.op, class: o.cls, 'stroke-dasharray': o.dash });
export const circ = (x, y, r, o = {}) => el('circle', { cx: r2(x), cy: r2(y), r: r2(r), fill: o.fill || 'none', stroke: o.stroke, 'stroke-width': o.stroke ? Math.max(MIN_STROKE, o.w || .5) : null, opacity: o.op, class: o.cls });
export const path = (d, o = {}) => el('path', { d, fill: o.fill || 'none', stroke: o.stroke === undefined ? C.ink : o.stroke, 'stroke-width': o.stroke === null ? null : Math.max(MIN_STROKE, o.w || .5), 'stroke-linejoin': 'round', 'stroke-linecap': o.cap || 'round', 'stroke-dasharray': o.dash, opacity: o.op, class: o.cls, pathLength: o.draw ? 1 : null });
export const poly = (pts, o = {}) => path('M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L') + (o.close ? 'Z' : ''), o);
export const g = (inner, o = {}) => el('g', o, inner);
/* flèche (trait + pointe) */
export function arrow(x1, y1, x2, y2, o = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), s = o.head || 2.2, w = o.w || .7, c = o.c || C.ink;
  const hx = x2 - Math.cos(a) * s * .6, hy = y2 - Math.sin(a) * s * .6;
  return line(x1, y1, hx, hy, { c, w, dash: o.dash }) + el('path', { d: `M${r2(x2)} ${r2(y2)}L${r2(x2 - Math.cos(a - .42) * s)} ${r2(y2 - Math.sin(a - .42) * s)}L${r2(x2 - Math.cos(a + .42) * s)} ${r2(y2 - Math.sin(a + .42) * s)}Z`, fill: c });
}
/* révélation progressive : visible à partir de l'étape k ; l'élément qui vient d'apparaître est animé (sens avant seulement) */
export const at = (st, k, inner, o = {}) => {
  if (st < k) return '';
  /* o.fade : dès qu'une étape ultérieure apparaît, cette annotation « recule » (opacité réduite, plus un point focal) — un seul centre d'attention à la fois */
  const old = o.fade && st > k, rest = o.rest && st > k;
  return el('g', { class: 'st-r' + (st === k && K.fwd ? ' enter' : '') + (old ? ' st-old' : '') + (rest ? ' st-rest' : '') + (o.cls ? ' ' + o.cls : ''), 'data-s': k },
    rest ? inner.replace(/\bclass="([^"]*)\bfp\b([^"]*)"/g, 'class="$1$2"') : old ? inner.replace(/\bclass="([^"]*)\bfp\b([^"]*)"/g, 'class="$1$2"').replace(/<text /g, '<text data-old="1" ') : inner);
};
/* projecteur : assombrit tout sauf un disque (cx,cy,r) — gère l'attention quand la figure est riche. Visible à partir de l'étape k. */
export const spotlight = (st, k, cx, cy, r, o = {}) => st < k || (o.until != null && st > o.until) ? '' :
  el('path', { class: 'st-spot' + (st === k && K.fwd ? ' enter' : ''), d: `M0 0H${W}V${H}H0Z M${r2(cx + r)} ${r2(cy)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(cx - r)} ${r2(cy)}A${r2(r)} ${r2(r)} 0 1 0 ${r2(cx + r)} ${r2(cy)}Z`, 'fill-rule': 'evenodd', fill: '#0c1116', opacity: o.op || .55 });
/* détail secondaire : supprimé en amphithéâtre (le texte restant est plus grand, pas plus nombreux) */
export const lo = inner => K.amphi || K.narrow ? '' : inner;
/* pastille numérotée / lettrée */
export const badge = (x, y, s, o = {}) => circ(x, y, o.r || 2.6, { fill: o.fill || C.pri, cls: o.quiet ? null : 'fp' }) + txt(x, y + .1, s, { size: o.size || 3.6, fill: '#fff', halo: false, w: 800 });
/* étiquette sur fond plein (lisible partout) */
export function tag(x, y, s, o = {}) {
  const size = Math.max(MIN, o.size || 4) * K.fs, w = s.length * size * .6 + 4, h = size * 1.5;
  const ax = o.anchor || 'middle'; let x0 = ax === 'start' ? x : ax === 'end' ? x - w : x - w / 2;
  const nx = Math.min(Math.max(x0, 1), Math.max(1, W - 1 - w)); x = x + (nx - x0); x0 = nx;
  return rect(x0, y - h / 2, w, h, { fill: o.fill || C.ink, rx: h * .28, op: o.op, cls: 'fp' }) + txt(ax === 'start' ? x + 1.5 : ax === 'end' ? x - 1.5 : x, y + .1, s, { size: o.size || 4, fill: o.color || '#fff', anchor: ax, halo: false, w: 800 });
}
/* retour à la ligne glouton (n caractères max par ligne) */
export const wrap = (s, n) => { const w = String(s).split(' '), out = []; let c = ''; for (const x of w) { if ((c + ' ' + x).trim().length > n && c) { out.push(c); c = x; } else c = (c + ' ' + x).trim(); } if (c) out.push(c); return out; };
/* choisit la plus grande taille (≤ size0 × facteur de salle) pour laquelle `label` tient dans W unités sur ≤ maxLines lignes ; jamais sous MIN */
export function fit(label, W, size0, maxLines = 2) {
  for (let s = size0 * K.fs; s >= MIN - 1e-9; s -= .2) { const chars = Math.max(4, Math.floor(W / (s * .6))), lines = wrap(label, chars); if (lines.length <= maxLines && lines.every(l => l.length <= chars)) return { lines, size: s }; }
  return { lines: wrap(label, Math.floor(W / (MIN * .6))), size: MIN };
}
/* idem, mais le bloc doit aussi tenir dans une HAUTEUR H (unités logiques) : lignes × taille × interligne ≤ H. Sans cela, quand la salle ou le format
   (4:3) agrandit le texte, il déborde de sa carte ou de son bandeau (audit v3.1 : « Sont verticaux » coupé, bulles recouvrant les schémas).
   Retombe sur MIN, jamais en dessous. */
export function fitBox(label, W, H, size0, maxLines = 2, lh = 1.16) {
  for (let s = size0 * K.fs; s >= MIN - 1e-9; s -= .2) {
    const chars = Math.max(4, Math.floor(W / (s * .6))), lines = wrap(label, chars);
    if (lines.length <= maxLines && lines.every(l => l.length <= chars) && lines.length * s * lh <= H) return { lines, size: s };
  }
  return { lines: wrap(label, Math.floor(W / (MIN * .6))), size: MIN };
}
/* géométrie d'une étiquette `tag` (mêmes formules) et écartement vertical des étiquettes qui se chevauchent : items = [{ x, y, s, o }] → y corrigés
   (même ordre). Ne bouge que le strict nécessaire ; au plus 6 passes. */
export function tagBox(x, y, s, o = {}) {
  const size = Math.max(MIN, o.size || 4) * K.fs, w = s.length * size * .6 + 4, h = size * 1.5, ax = o.anchor || 'middle';
  return { x0: ax === 'start' ? x : ax === 'end' ? x - w : x - w / 2, y0: y - h / 2, w, h };
}
export function declutter(items, gap = .6) {
  const ys = items.map(i => i.y), idx = items.map((_, i) => i).sort((a, b) => ys[a] - ys[b]);
  for (let pass = 0; pass < 6; pass++) {
    let moved = false;
    for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) {
      const ia = idx[a], ib = idx[b], A = tagBox(items[ia].x, ys[ia], items[ia].s, items[ia].o), B = tagBox(items[ib].x, ys[ib], items[ib].s, items[ib].o);
      const ox = Math.min(A.x0 + A.w, B.x0 + B.w) - Math.max(A.x0, B.x0), oy = Math.min(A.y0 + A.h, B.y0 + B.h) - Math.max(A.y0, B.y0);
      if (ox > 0 && oy > -gap) { const push = (oy + gap) / 2, up = ys[ia] <= ys[ib]; ys[ia] += up ? -push : push; ys[ib] += up ? push : -push; moved = true; }
    }
    if (!moved) break;
  }
  return ys;
}
/* hauteur d'un bandeau d'énoncé à 2 lignes au bas d'une figure, à la taille de salle courante (5,4 u de base : 17 u à l'échelle 1).
   Les schémas placés au-dessus doivent lui laisser cette place (voir SEC dans coupe.js). */
export const calloutH = (lines = 2, size = 5.4) => lines * size * K.fs * 1.28 + 3.2;
export const svgWrap = inner => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;

/* échelle linéaire */
export const lin = (d0, d1, r0, r1) => v => r0 + (v - d0) / (d1 - d0 || 1) * (r1 - r0);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* types de séquence pédagogique : pictogramme (forme ≠ couleur seule) + couleur */
export const KINDS = {
  hook: { ic: 'M12 4a8 8 0 100 16 8 8 0 000-16zM9.4 9.6a2.7 2.7 0 115 1.6c-.8 1-2.4 1.3-2.4 2.9M12 17.4v.2', c: '#7b3fb4' },
  show: { ic: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z', c: '#1b62c4' },
  build: { ic: 'M4 20l6-6M14 4l6 6-9 9-6-6zM12 6l6 6', c: '#0b5c4c' },
  vote: { ic: 'M8 21v-9l-2-1V7l3 1V5a1.5 1.5 0 013 0v5l5 1.5a2 2 0 011.4 2.2L18 19a2 2 0 01-2 2z', c: '#d2461e' },
  practice: { ic: 'M4 20l1-4.5L16.5 4 20 7.5 8.5 19z', c: '#b36b00' },
  recap: { ic: 'M4 12l5 5L20 6', c: '#1f8f4e' }
};
/* participation : ces séquences comptent comme « l'élève agit » */
export const ACTIVE = new Set(['hook', 'vote', 'practice']);
