/* Figures géologiques en SVG (repère logique du kit) — issues du moteur Géologie (régions et contacts vectoriels), pas d'un canvas.
   Une carte est préparée une fois (prep), puis recomposée à volonté : formations estompées, contact surligné, courbes de niveau, étiquettes. */
import * as K from '../kit.js';
import { litGrid, gridRegions, contactRuns, labelPoint, sectionGrid, sectionRegions, sectionContact } from '../../engine/geology/index.js';
import { levelPaths } from './maps.js';
import { projColor, projId } from '../palette.js';
const { C, txt, line, rect, circ, path, arrow, tag } = K;

export function prep(geo, res = 2) {
  const g = litGrid(geo, res), R = gridRegions(g.ids, g.W, g.H, .3), lab = new Map();
  R.forEach(r => { const p = labelPoint(g.ids, g.W, g.H, r.u); if (p) lab.set(r.u, p); });
  return { geo, g, R, lab, ord: R.map(r => r.u), cc: new Map() };
}
const toBox = (ctx, box) => { const sx = box.w / (ctx.g.W - 1), sy = box.h / (ctx.g.H - 1); return p => [box.x + p[0] * sx, box.y + p[1] * sy]; };
const D = (chains, f) => chains.map(c => 'M' + c.pts.map(p => { const q = f(p); return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + (c.closed ? 'Z' : '')).join('');
export const unitColor = (ctx, u) => projColor(ctx.geo.units[u]);
/* opacité des formations estompées : ≥ .4 pour qu'elles restent visibles sous un projecteur délavé (F10) */
export const DIM_OP = .4;
/* o : { eq (courbes de niveau), dim: Set d'unités estompées, only: unité seule en couleur, labels: bool|Set, contact: [u,v], contactW, frame } */
export function geoMapSvg(ctx, box, o = {}) {
  const f = toBox(ctx, box); let s = '';
  const dim = u => (o.dim && o.dim.has(u)) || (o.only != null && o.only !== u);
  for (const r of ctx.R) {
    const col = unitColor(ctx, r.u), d = D(r.chains, f), a = dim(r.u) ? DIM_OP : 1;
    s += K.el('path', { d, fill: col, 'fill-rule': 'evenodd', stroke: col, 'stroke-width': .36, opacity: a });
  }
  if (o.eq) for (const lv of levelPaths(ctx.geo.dem, o.eq, box)) s += path(lv.d, { stroke: '#1b1b1b', w: lv.level % (o.eq * 5) === 0 ? .5 : .36, op: o.eqOp || .55 });
  for (const r of ctx.R) s += K.el('path', { d: D(r.chains, f), fill: 'none', stroke: '#14181c', 'stroke-width': o.contactW || .42, 'stroke-linejoin': 'round' });
  if (o.contact) { const cd = contactD(ctx, box, o.contact[0], o.contact[1]), cw = o.hlW || 1.25; s += path(cd, { stroke: '#fff', w: cw + 1.2 }) + path(cd, { stroke: o.contactColor || C.acc, w: cw }); }   /* liseré blanc : le rouge seul est à < 3:1 sur 6 formations (F8) */
  if (o.labels) for (const [u, p] of ctx.lab) { if (o.labels instanceof Set && !o.labels.has(u)) continue; const q = f(p); s += txt(q[0], q[1], projId(ctx.geo.units[u]), { size: o.labelSize || 4.6, w: 800 }); }
  return s + K.rect(box.x, box.y, box.w, box.h, { fill: 'none', stroke: C.ink, w: .6 });
}
export function contactD(ctx, box, u, v) {
  const k = u + '-' + v + '|' + box.x + ',' + box.y + ',' + box.w + ',' + box.h; if (ctx.cc.has(k)) return ctx.cc.get(k);
  const f = toBox(ctx, box), runs = contactRuns(ctx.g.ids, ctx.g.W, ctx.g.H, u, v, .3).map(r => ({ closed: false, pts: r })), d = D(runs, f); ctx.cc.set(k, d); return d;
}
/* point de la carte (coordonnées MNT) → repère de la figure */
export const mapPt = (ctx, box, p) => [box.x + p.x / (ctx.geo.dem.W - 1) * box.w, box.y + p.y / (ctx.geo.dem.H - 1) * box.h];
/* légende : pastilles empilées du plus récent (haut) au plus ancien (bas) — la colonne du temps */
export function legendSvg(ctx, x, y, w, hh, o = {}) {
  const ord = ctx.ord.filter(u => !ctx.geo.units[u].ign), ign = ctx.ord.filter(u => ctx.geo.units[u].ign), n = ord.length + ign.length, ch = hh / n; let s = '';
  [...ord].reverse().concat(ign).forEach((u, i) => {
    const yy = y + i * ch, un = ctx.geo.units[u], hl = o.hl && o.hl.has(u);
    s += rect(x, yy + .4, w, ch - .8, { fill: projColor(un), stroke: hl ? C.acc : C.ink, w: hl ? 1.1 : .45, rx: 1 }) + txt(x + w / 2, yy + ch / 2 + .1, projId(un), { size: Math.min(4.6, ch * .62), w: 800, halo: true });
  });
  return s;
}
/* repère « sens du temps » le long de la légende */
export const timeArrow = (x, y1, y2, label, o = {}) => arrow(x, y2, x, y1, { c: C.mute, w: .7, head: 2.4 }) + (label ? txt(x - 1.5, (y1 + y2) / 2, label, { size: 3.8, w: 700, fill: C.mute, rot: -90, anchor: 'middle' }) : '');
/* symbole de pendage : trait de direction + tiret vers le plongement + valeur */
export function dipSymbol(x, y, strikeAz, dipAz, dip, o = {}) {
  const R = Math.PI / 180, L = o.L || 6, sx = Math.sin(strikeAz * R), sy = -Math.cos(strikeAz * R), dx = Math.sin(dipAz * R), dy = -Math.cos(dipAz * R), c = o.c || C.ink;
  return line(x - sx * L, y - sy * L, x + sx * L, y + sy * L, { c: '#fff', w: 2.4 }) + line(x, y, x + dx * L * .55, y + dy * L * .55, { c: '#fff', w: 2.4 }) + line(x - sx * L, y - sy * L, x + sx * L, y + sy * L, { c, w: 1 }) + line(x, y, x + dx * L * .55, y + dy * L * .55, { c, w: 1 }) + (o.label !== false ? txt(x + dx * L * 1.25 + dx * 2.5, y + dy * L * 1.25 + dy * 2.2, String(Math.round(dip)), { size: 4, w: 800, fill: c }) : '');
}

/* milieu du plus long tronçon d'un contact, dans le repère de la figure (pour y poser une étiquette) */
export function contactMid(ctx, box, u, v) {
  const f = toBox(ctx, box), runs = contactRuns(ctx.g.ids, ctx.g.W, ctx.g.H, u, v, .3); if (!runs.length) return null;
  const r = runs.reduce((m, q) => q.length > m.length ? q : m, runs[0]); return f(r[r.length >> 1]);
}
/* flèche de direction (azimut depuis le nord) posée dans la figure */
export function azArrow(x, y, az, L, o = {}) { const R = Math.PI / 180, x2 = x + Math.sin(az * R) * L, y2 = y - Math.cos(az * R) * L, w = o.w || 1.1, hd = o.head || 3; return arrow(x, y, x2, y2, { c: '#fff', w: w + 1.4, head: hd + 1.2 }) + arrow(x, y, x2, y2, { c: o.c || C.acc, w, head: hd }); }

/* petit cadre de texte plein : UN seul point focal quelle que soit sa longueur (le texte intérieur n'est pas focal) */
export function callout(x, y, label, o = {}) {
  /* o.top : la bulle ne doit pas monter au-dessus de cette ordonnée (ex. sous une légende) ; o.maxH : hauteur maximale.
     Le texte rétrécit (jamais sous MIN) pour tenir dans la bande au lieu de déborder sur la figure. */
  const w = o.w || 50, top = o.top || 0, maxH = Math.min(o.maxH || 99, 69 - top), f = K.fitBox(label, w - 4, maxH - 3.2, o.size || 5.4, o.lines || 3, 1.28), lh = f.size * 1.28, h = f.lines.length * lh + 3.2;
  y = Math.min(Math.max(y, h / 2 + 1, top + h / 2), 69 - h / 2);
  return rect(x - w / 2, y - h / 2, w, h, { fill: o.fill || C.ink, rx: 2, cls: 'fp' }) + K.txtL(x, y - (f.lines.length - 1) * lh / 2, f.lines, { size: f.size, lh, fill: o.color || '#fff', halo: false, w: 800, fixed: true });
}
/* sens du pendage en toutes lettres : « vers l’Est » */
export const TOWARD = ['le Nord', 'le Nord-Est', 'l’Est', 'le Sud-Est', 'le Sud', 'le Sud-Ouest', 'l’Ouest', 'le Nord-Ouest'];
export const toward = az => TOWARD[Math.round((((az % 360) + 360) % 360) / 45) % 8];
/* titre d'un vote, centré au-dessus de la carte (2 lignes au plus) */
export const top = (s, w = 80) => { const f = K.fit(s, w, 4.8, 2); return K.txtL(44, 3.4 + (f.lines.length > 1 ? 0 : 2.4), f.lines, { size: f.size, lh: f.size * 1.18, w: 800, fixed: true }); };
