/* Les « mondes » géologiques de la séance : mêmes terrains, mêmes graines → mêmes cartes sur chaque poste.
   · mission : le terrain de la mission + une série monoclinale réglée pour que le trajet A→B coupe plusieurs contacts
   · galerie : une structure par terrain choisi pour que la forme des contacts parle (plateau, bassin, vallée)
   · exercice : un second monoclinal, plus raide. Tout vient du moteur Géologie (aucune géométrie recopiée ici). */
import { makeDem } from '../../engine/terrain/index.js';
import { profileAlong } from '../../engine/profile/line.js';
import * as G from '../../engine/geology/index.js';
import { mission } from './mission.js';
import { prep, mapPt } from './geomap.js';

export const BOX = { x: 2, y: .5, w: 100, h: 68.9 };
const RAD = Math.PI / 180, cache = {};
const azOf = (A, B) => (Math.atan2(B.x - A.x, -(B.y - A.y)) / RAD + 360) % 360;
const memo = (k, f) => cache[k] || (cache[k] = f());

/* ---------- problème des trois points : tout est calculé ici, puis vérifié par planeFrom3 ---------- */
export function threePoints(geo, u, v) {
  const dm = geo.dem, tri = G.pickThreeFat(G.contactSamples(geo, u, v).filter(q => q.x > 8 && q.x < dm.W - 9 && q.y > 6 && q.y < dm.H - 7), 40, 5); if (!tri) return null;
  const cm = geo.dem.cellM, [p1, p2, p3] = [...tri].sort((a, b) => a.z - b.z), t = (p2.z - p1.z) / (p3.z - p1.z);
  const Q = { x: p1.x + (p3.x - p1.x) * t, y: p1.y + (p3.y - p1.y) * t, z: p2.z };
  let sx = Q.x - p2.x, sy = Q.y - p2.y; const L = Math.hypot(sx, sy); sx /= L; sy /= L;
  let nx = -sy, ny = sx; if ((p1.x - p2.x) * nx + (p1.y - p2.y) * ny < 0) { nx = -nx; ny = -ny; }          // normale tournée vers le BAS
  const dc = Math.abs((p1.x - p2.x) * nx + (p1.y - p2.y) * ny), d = dc * cm, dz = p2.z - p1.z;
  const dipAz = (Math.atan2(nx, -ny) / RAD + 360) % 360, strikeAz = ((Math.atan2(sx, -sy) / RAD) % 180 + 180) % 180, dip = Math.atan(dz / d) / RAD;
  const ex = G.planeFrom3([p1, p2, p3].map(p => [p.x * cm, -p.y * cm, p.z]));
  return { u, v, p: [p1, p2, p3], Q, strikeAz, dipAz, dip, d, dz, exact: ex };
}

/* ---------- la série de la MISSION : monoclinal, pendage 35°, plongement à 30° du trajet, couches minces le long de A→B ----------
   La carte géologique montre la FENÊTRE autour du trajet (96 × 66 mailles, 2,4 × 1,65 km), comme une vraie carte au 1/25 000 :
   sur toute la région, un trajet de 1,5 km ne couperait que le cœur de bandes immenses. Les épaisseurs sont réglées sur A→B. */
export const WIN = { x0: 53, y0: 26, w: 96, h: 66 };
export function cropDem(d, x0, y0, W, H) {
  const z = new d.z.constructor(W * H); let mn = 1e9, mx = -1e9;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = d.z[(y0 + j) * d.W + x0 + i]; z[j * W + i] = v; if (v < mn) mn = v; if (v > mx) mx = v; }
  return { ...d, W, H, z, zmin: mn, zmax: mx, _ct: {}, _an: undefined };
}
export function missionGeo() {
  return memo('mission', () => {
    const m = mission(), d = cropDem(m.d, WIN.x0, WIN.y0, WIN.w, WIN.h), A = { x: m.A.x - WIN.x0, y: m.A.y - WIN.y0 }, B = { x: m.B.x - WIN.x0, y: m.B.y - WIN.y0 };
    const az = azOf(A, B), P = profileAlong(d, A, B, 500), dip = 35, dipAz = Math.round((az + 30) % 360), g0 = G.makeGeology(d, 'monoclinal', 4, { dip, dipAz });
    const v = P.map(q => g0.field(g0.X(q.x), g0.Y(q.y), q.z)), lo = Math.min(...v), hi = Math.max(...v);
    const cuts = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * (i + .6) / 5.2), bnd = [lo - 1e4, ...cuts, hi + 1e4];
    const geo = G.makeGeology(d, 'monoclinal', 4, { dip, dipAz, bnd }), ctx = prep(geo), cps = G.contactPointsAlong(geo, P);
    const tp = [[1, 2], [2, 3], [3, 4], [0, 1], [4, 5]].map(([u, w]) => threePoints(geo, u, w)).filter(Boolean).reduce((b, t) => !b || t.d > b.d ? t : b, null);
    return { ...ctx, m, A, B, P, az, dip, dipAz, cps, tp, units: [...new Set(P.map(q => geo.litho(geo.X(q.x), geo.Y(q.y), q.z)))], apparent: G.apparentDip(dip, dipAz, az) };
  });
}
/* tabulaire sur le terrain de la mission : contacts exactement aux altitudes 400, 500, 600, 700 m (courbes maîtresses) */
export function tabGeo() {
  return memo('tab', () => { const d = mission().d, geo = G.makeGeology(d, 'tabulaire', 4, { bnd: [0, 400, 500, 600, 700, 9000] }); return { ...prep(geo), levels: [400, 500, 600, 700] }; });
}
/* galerie des structures (une par terrain adapté) */
const GAL = [
  ['tabulaire', () => ({ ...tabGeo(), eq: 100 })],
  ['monoclinal', () => ({ ...monoV(), eq: 40 })],
  ['anticlinal', () => fromDem({ type: 'bassin', seed: 2 }, 'anticlinal', 2, 40)],
  ['synclinal', () => fromDem({ type: 'bassin', seed: 2 }, 'synclinal', 2, 40)],
  ['discordance', () => fromDem({ type: 'plateau', seed: 8 }, 'discordance', 4, 40)],
  ['granite', () => fromDem({ type: 'plateau', seed: 8 }, 'granite', 4, 40)],
  ['filon', () => fromDem({ type: 'plateau', seed: 8 }, 'filon', 4, 40)]
];
function fromDem(dem, kind, seed, eq, opts = {}) { return memo(`${dem.type}${dem.seed}${kind}${seed}${JSON.stringify(opts)}`, () => { const d = makeDem({ ...dem, scaleN: 25000 }), geo = G.makeGeology(d, kind, seed, opts); return { ...prep(geo), eq }; }); }
const monoV = () => fromDem({ type: 'vallee', seed: 5 }, 'monoclinal', 5, 40);
export const KINDS_ORDER = GAL.map(g => g[0]);
export const galerie = kind => GAL.find(g => g[0] === kind)[1]();
export const monoValley = monoV;
/* exercice : monoclinal raide sur le terrain « vallée », trois points sur le premier contact exploitable */
/* le contact le plus « lisible » d'une carte : celui dont le triangle des trois points a la plus grande base horizontale d */
const bestTp = geo => { let tp = null; for (let u = 0; u < geo.units.length - 1; u++) { const t = threePoints(geo, u, u + 1); if (t && (!tp || t.d > tp.d)) tp = t; } return tp; };
/* DÉMONSTRATION des trois points : bassin, monoclinal doux → contacts en grandes courbes, triangle large (d ≈ 700 m) */
export function demoGeo() { return memo('demo', () => { const c = fromDem({ type: 'bassin', seed: 5 }, 'monoclinal', 5, 40, { dip: 28, dipAz: 190 }); return { ...c, tp: bestTp(c.geo) }; }); }
/* EXERCICE : autre bassin, autre pendage, autre sens */
export function exoGeo() { return memo('exo', () => { const c = fromDem({ type: 'bassin', seed: 2 }, 'monoclinal', 2, 40, { dip: 30, dipAz: 100 }); return { ...c, tp: bestTp(c.geo) }; }); }
/* deux points d'une même formation, à des altitudes très différentes (pour dire : une couleur n'est pas une altitude) */
export function extremes(ctx, u) {
  const d = ctx.geo.dem; let lo = null, hi = null;
  for (let j = 10; j < d.H - 10; j += 2) for (let i = 10; i < d.W - 10; i += 2) if (ctx.geo.at(i, j) === u) { const z = d.z[j * d.W + i]; if (!lo || z < lo.z) lo = { x: i, y: j, z }; if (!hi || z > hi.z) hi = { x: i, y: j, z }; }
  return lo && hi ? { lo, hi } : null;
}
/* trajet dans la direction `az` qui rencontre le plus de formations différentes : { a, b, seq:[{u, p}] } en coordonnées MNT */
export function walkLine(ctx, az) {
  const d = ctx.geo.dem, dx = Math.sin(az * RAD), dy = -Math.cos(az * RAD); let best = null;
  for (let k = 0; k < 40; k++) {
    const sx = 8 + (d.W - 16) * ((k * 0.618) % 1), sy = 6 + (d.H - 12) * ((k * 0.382) % 1);
    let t0 = 0; while (sx - dx * (t0 + 1) > 2 && sx - dx * (t0 + 1) < d.W - 3 && sy - dy * (t0 + 1) > 2 && sy - dy * (t0 + 1) < d.H - 3) t0++;
    const a = { x: sx - dx * t0, y: sy - dy * t0 }, seq = []; let last = -1, n = 0, run = null;
    for (let t = 0; ; t += .5) { const x = a.x + dx * t, y = a.y + dy * t; if (x > d.W - 3 || y > d.H - 3 || x < 2 || y < 2) break; const u = ctx.geo.at(x, y); if (u !== last) { run = { u, p: { x, y }, t0: t }; seq.push(run); last = u; } run.t1 = t; n = t; }
    const sc = new Set(seq.map(q => q.u)).size * 1000 + n; if (!best || sc > best.sc) best = { sc, a, b: { x: a.x + dx * n, y: a.y + dy * n }, seq: seq.map(q => ({ u: q.u, p: { x: a.x + dx * (q.t0 + q.t1) / 2, y: a.y + dy * (q.t0 + q.t1) / 2 } })) };
  }
  return best;
}
/* lignes de coupe choisies par balayage (déterministe) : la trace qui recoupe le plus de contacts */
export const TAB_AB = { A: { x: 9.015, y: 44.899 }, B: { x: 102.985, y: 79.101 } };      // carte tabulaire de la mission : 11 contacts, 6 niveaux
export const EXO_AB = { A: { x: 63.042, y: 66.679 }, B: { x: 144.958, y: 9.321 } };      // exercice : cap 55°, 4 contacts
/* trace centrée, horizontale (W→E) et longue de n mailles : pour la galerie des structures */
export const midLine = (ctx, n = 70) => { const d = ctx.geo.dem; return { A: { x: d.W / 2 - n / 2, y: d.H / 2 }, B: { x: d.W / 2 + n / 2, y: d.H / 2 } }; };
export { mapPt };
