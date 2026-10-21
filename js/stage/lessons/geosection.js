/* Coupes géologiques en SVG (repère logique du kit). Tout vient du moteur Géologie :
   · sectionGrid / sectionRegions / sectionContact : la coupe EXACTE le long de A→B (formations, contacts)
   · contactPointsAlong : où la trace A→B coupe chaque contact en surface (le point de départ de toute construction)
   La construction de l'élève (droites au pendage apparent) est dessinée par-dessus, puis comparée à la coupe exacte. */
import * as K from '../kit.js';
import { sectionGrid, sectionRegions, sectionContact, contactPointsAlong, labelPoint, profileAlong } from '../../engine/geology/index.js';
const { C, txt, line, rect, circ, path, el } = K;

const cache = new WeakMap();
/* coupe de la carte `ctx` (préparée par geomap.prep) le long de A→B */
export function sectionOf(ctx, A, B, ns = 260, nz = 140, depth = null) {
  const m = cache.get(ctx) || new Map(); cache.set(ctx, m);
  const k = `${A.x},${A.y},${B.x},${B.y},${ns},${nz},${depth}`; if (m.has(k)) return m.get(k);
  /* depth : profondeur (en fraction de la longueur de la coupe) sous le point le plus bas du profil — par défaut le moteur garde 20 % du relief */
  let zbAbs; if (depth != null) { const P0 = profileAlong(ctx.geo.dem, A, B, ns - 1); zbAbs = Math.min(...P0.map(p => p.z)) - depth * Math.hypot((B.x - A.x), (B.y - A.y)) * ctx.geo.dem.cellM; }
  const sec = sectionGrid(ctx.geo, A, B, ns, nz, zbAbs), S = { ctx, geo: ctx.geo, sec, R: sectionRegions(sec), P: sec.P, L: sec.L, cps: contactPointsAlong(ctx.geo, sec.P), A, B, az: sec.az, lab: new Map(), cc: new Map() };
  S.R.forEach(r => { const p = labelPoint(sec.g, sec.ns, sec.nz, r.u); if (p) S.lab.set(r.u, p); });
  m.set(k, S); return S;
}
/* cadre : échelle horizontale = box.w / L ; échelle verticale = échelle horizontale × ev (ev = 1 : coupe « vraie », angles conservés).
   Si la coupe est plus haute que la boîte (ev > 1) on ne montre que la tranche la plus proche de la surface. */
export function frame(S, box, ev = 1) {
  const k = box.w / S.L, kz = k * ev, full = (S.sec.zt - S.sec.zb) * kz, h = Math.min(box.h, full), zt = S.sec.zt, zb = zt - h / kz;
  return { box: { ...box, h }, k, kz, ev, zt, zb, X: s => box.x + s * k, Z: z => box.y + (zt - z) * kz, S };
}
const f2 = n => Math.round(n * 100) / 100;
const gridPt = (S, F) => p => [F.X(p[0] / (S.sec.ns - 1) * S.L), F.Z(S.sec.zt - (S.sec.zt - S.sec.zb) * p[1] / (S.sec.nz - 1))];
const D = (chains, f) => chains.map(c => 'M' + c.pts.map(p => { const q = f(p); return f2(q[0]) + ' ' + f2(q[1]); }).join('L') + (c.closed ? 'Z' : '')).join('');
export const unitColor = (S, u) => S.geo.units[u].c;
/* identifiant de clipPath déterministe (empreinte de la géométrie) : deux rendus identiques donnent le même SVG */
const hash = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
/* tout ce qui est dessiné dans `inner` est rogné à la boîte, et au-dessous du terrain si o.ground */
export function clipped(S, F, inner, o = {}) {
  const B = F.box, shape = o.ground ? path(terrainPoly(S, F), { fill: '#000', stroke: null }) : rect(B.x, B.y, B.w, B.h), id = 'gcs' + hash(shape);
  return el('clipPath', { id }, shape) + el('g', { 'clip-path': `url(#${id})` }, inner);
}
/* courbe du terrain (s, z) → chemin */
export const terrainD = (S, F) => 'M' + S.P.map(p => f2(F.X(p.s)) + ' ' + f2(F.Z(p.z))).join('L');
export const terrainPoly = (S, F) => terrainD(S, F) + `L${f2(F.X(S.L))} ${f2(F.box.y + F.box.h)}L${f2(F.X(0))} ${f2(F.box.y + F.box.h)}Z`;
/* formations de la coupe (remplissage). o.only : une seule formation en couleur ; o.dim : Set estompé ; o.op : opacité globale */
export function regionsSvg(S, F, o = {}) {
  const f = gridPt(S, F); let s = '';
  for (const r of S.R) {
    const col = unitColor(S, r.u), a = ((o.dim && o.dim.has(r.u)) || (o.only != null && o.only !== r.u) ? .2 : 1) * (o.op == null ? 1 : o.op);
    s += el('path', { d: D(r.chains, f), fill: col, 'fill-rule': 'evenodd', stroke: col, 'stroke-width': 1, opacity: a });
  }
  if (o.lines !== false) for (const r of S.R) s += el('path', { d: D(r.chains, f), fill: 'none', stroke: '#14181c', 'stroke-width': o.lineW || .45, 'stroke-linejoin': 'round', opacity: o.lineOp == null ? 1 : o.lineOp });
  const placed = [];
  if (o.labels) for (const [u, p] of S.lab) { const q = f(p); if (q[1] < F.box.y + 2 || q[1] > F.box.y + F.box.h - 2 || placed.some(r => Math.abs(r[0] - q[0]) < 8 && Math.abs(r[1] - q[1]) < 5)) continue; placed.push(q); s += txt(q[0], q[1], S.geo.units[u].id, { size: o.labelSize || 4.4, w: 800 }); }
  return s;
}
/* tracé exact d'un contact u/v en coupe */
export function contactD(S, F, u, v) { return D(sectionContact(S.sec, u, v, .3).map(r => ({ closed: false, pts: r })), gridPt(S, F)); }
/* la bande colorée posée sur le profil : la « carte » vue le long de A→B */
export function stripSvg(S, F, o = {}) {
  const cps = S.cps, segs = []; let s0 = 0, u = cps.length ? cps[0].from : 0;
  cps.forEach(c => { segs.push([s0, c.s, u]); s0 = c.s; u = c.to; }); segs.push([s0, S.L, u]);
  let out = '';
  for (const [a, b, uu] of segs) {
    const pts = S.P.filter(p => p.s >= a - 1e-6 && p.s <= b + 1e-6); if (pts.length < 2) continue;
    out += path('M' + pts.map(p => f2(F.X(p.s)) + ' ' + f2(F.Z(p.z))).join('L'), { stroke: unitColor(S, uu), w: o.w || 2.6, cap: 'butt' });
  }
  return out + path(terrainD(S, F), { stroke: C.ink, w: .5 });
}
/* points d'intersection trace/contact sur le profil */
export const contactDots = (S, F, r = 1.3) => S.cps.map(c => circ(F.X(c.s), F.Z(c.z), r, { fill: '#fff', stroke: C.ink, w: .6 })).join('');
/* droite de contact issue du point (s, z) avec un pendage apparent `a` (degrés) ; sens = +1 : elle descend vers B (droite) */
export function dipLine(F, c, a, sens = 1, o = {}) {
  const x0 = F.X(c.s), y0 = F.Z(c.z), t = Math.tan(a * Math.PI / 180) * F.ev, B = F.box;
  const xEnd = sens > 0 ? B.x + B.w : B.x, yEnd = y0 + Math.abs(xEnd - x0) * t;
  const y1 = Math.min(yEnd, B.y + B.h), x1 = yEnd > B.y + B.h ? x0 + sens * (B.y + B.h - y0) / t : xEnd;
  return line(x0, y0, x1, y1, { c: o.c || C.ink, w: o.w || 1, dash: o.dash });
}
/* le terrain : aplat clair sous la ligne de crête, puis le cadre */
export const groundFill = (S, F, fill = '#f3ece0') => path(terrainPoly(S, F), { fill, stroke: null });
export const frameRect = F => rect(F.box.x, F.box.y, F.box.w, F.box.h, { fill: 'none', stroke: C.ink, w: .6 });
/* angle (degrés) mesuré sur la figure pour un pendage apparent a, selon l'exagération verticale */
export const drawnAngle = (a, ev) => Math.atan(Math.tan(a * Math.PI / 180) * ev) * 180 / Math.PI;
/* angle réel moyen du contact u/v dans la coupe exacte (pour vérifier la construction) : régression sur les points */
export function exactAngle(S, u, v) {
  const runs = sectionContact(S.sec, u, v, .3); if (!runs.length) return null;
  const r = runs.reduce((m, q) => q.length > m.length ? q : m, runs[0]), sg = a => a / (S.sec.ns - 1) * S.L, zg = rr => S.sec.zt - (S.sec.zt - S.sec.zb) * rr / (S.sec.nz - 1);
  const a = r[0], b = r[r.length - 1], ds = sg(b[0]) - sg(a[0]), dz = zg(b[1]) - zg(a[1]); return Math.abs(Math.atan2(Math.abs(dz), Math.abs(ds)) * 180 / Math.PI);
}
