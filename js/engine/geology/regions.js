/* Géologie → figures vectorielles. Données uniquement (polylignes en mailles), jamais de dessin ; déterministe.
   Une carte (ou une coupe) est d'abord échantillonnée en grille d'identifiants de formations ; chaque formation devient une région fermée
   (marching squares sur son indicateur lissé, moteur Contour), les CONTACTS en sont les portions de contour voisines d'une autre formation. */
import { contours } from '../contour/contours.js';
import { sample } from '../terrain/dem.js';
import { profileAlong } from '../profile/line.js';

/* grille d'identifiants de formations sur la carte, échantillonnée `res` fois plus finement que le MNT ; coordonnées MNT = k / res */
export function litGrid(geo, res = 2) {
  const d = geo.dem, W = (d.W - 1) * res + 1, H = (d.H - 1) * res + 1, ids = new Int16Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) ids[j * W + i] = geo.at(i / res, j / res);
  return { W, H, ids, res };
}
/* indicateur lissé (flou 3×3) d'une formation, avec bordure nulle de 2 mailles : les contours se ferment toujours */
function indicator(ids, W, H, u, pad = 2) {
  const PW = W + 2 * pad, PH = H + 2 * pad, a = new Float32Array(PW * PH), b = new Float32Array(PW * PH);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) a[(j + pad) * PW + i + pad] = ids[j * W + i] === u ? 1 : 0;
  for (let j = 1; j < PH - 1; j++) for (let i = 1; i < PW - 1; i++) { let s = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) s += a[(j + dj) * PW + i + di]; b[j * PW + i] = s / 9; }
  return { f: b, PW, PH, pad };
}
const dp = (p, tol) => { /* Douglas–Peucker (ligne ouverte) */
  if (p.length < 3) return p; const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let m = -1, mi = -1; const [x1, y1] = p[a], [x2, y2] = p[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    for (let k = a + 1; k < b; k++) { const e = Math.abs(dy * (p[k][0] - x1) - dx * (p[k][1] - y1)) / L; if (e > m) { m = e; mi = k; } }
    if (m > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return p.filter((_, k) => keep[k]);
};
const simp = (c, tol) => {
  if (!c.closed) return { closed: false, pts: dp(c.pts, tol) };
  const p = c.pts; let k = 0, m = -1; for (let i = 1; i < p.length; i++) { const e = Math.hypot(p[i][0] - p[0][0], p[i][1] - p[0][1]); if (e > m) { m = e; k = i; } }
  const A = dp(p.slice(0, k + 1), tol), B = dp([...p.slice(k), p[0]], tol), q = [...A, ...B.slice(1, -1)];
  return { closed: true, pts: q.length >= 3 ? q : p };
};
/* contours (.5) de l'indicateur de la formation u, en coordonnées de grille */
export function regionChains(ids, W, H, u, tol = .3) {
  const { f, PW, PH, pad } = indicator(ids, W, H, u), d = { W: PW, H: PH, z: f, zmin: 0, zmax: 1, _ct: {} }, lv = contours(d, .5);
  if (!lv.length) return [];
  return lv[0].chains.map(c => simp({ closed: c.closed, pts: c.pts.map(p => [p[0] - pad, p[1] - pad]) }, tol));
}
/* régions de toutes les formations présentes : [{u, chains}] */
export function gridRegions(ids, W, H, tol = .3) {
  const seen = new Set(); for (let k = 0; k < ids.length; k++) if (ids[k] >= 0) seen.add(ids[k]);
  return [...seen].sort((a, b) => a - b).map(u => ({ u, chains: regionChains(ids, W, H, u, tol) }));
}
/* CONTACT entre u et v : portions du contour de v qui longent u (là où l'indicateur lissé de u dépasse .2) */
export function contactRuns(ids, W, H, u, v, tol = .3) {
  const { f, PW, pad } = indicator(ids, W, H, u), at = p => { const x = p[0] + pad, y = p[1] + pad, i = Math.floor(x), j = Math.floor(y), a = x - i, b = y - j, g = (ii, jj) => f[jj * PW + ii]; return (g(i, j) * (1 - a) + g(i + 1, j) * a) * (1 - b) + (g(i, j + 1) * (1 - a) + g(i + 1, j + 1) * a) * b; };
  const out = [];
  for (const c of regionChains(ids, W, H, v, tol)) {
    const pts = c.closed ? [...c.pts, c.pts[0]] : c.pts; let run = [];
    for (const p of pts) { if (at(p) > .2) run.push(p); else { if (run.length > 2) out.push(run); run = []; } }
    if (run.length > 2) out.push(run);
  }
  return out;
}
/* point d'ancrage d'une étiquette : maximum de l'indicateur fortement lissé (cœur de la région) */
export function labelPoint(ids, W, H, u, r = 7) {
  const a = new Float32Array(W * H), t = new Float32Array(W * H), g = (arr, i, j) => i < 0 || j < 0 || i >= W || j >= H ? 0 : arr[j * W + i];
  for (let k = 0; k < ids.length; k++) a[k] = ids[k] === u ? 1 : 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let s = 0; for (let k = -r; k <= r; k++) s += g(a, i + k, j); t[j * W + i] = s; }
  let best = -1, bx = 0, by = 0;
  for (let j = 0; j < H; j += 2) for (let i = 0; i < W; i += 2) { if (!a[j * W + i]) continue; let s = 0; for (let k = -r; k <= r; k += 2) s += g(t, i, j + k); if (s > best) { best = s; bx = i; by = j; } }
  return best < 0 ? null : [bx, by];
}
/* contacts rencontrés le long d'un profil P (profileAlong) : transitions de formation, localisées par dichotomie */
export function contactPointsAlong(geo, P) {
  const d = geo.dem, at = (p) => geo.litho(geo.X(p.x), geo.Y(p.y), p.z), out = [];
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, s: a.s + (b.s - a.s) * t });
  for (let k = 1; k < P.length; k++) {
    const a = P[k - 1], b = P[k], ua = at(a), ub = at(b); if (ua === ub) continue;
    let lo = 0, hi = 1; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (at(lerp(a, b, m)) === ua) lo = m; else hi = m; }
    const q = lerp(a, b, (lo + hi) / 2); out.push({ s: q.s, x: q.x, y: q.y, z: sample(d, q.x, q.y), from: ua, to: at(lerp(a, b, Math.min(1, hi + 1e-3))) });
  }
  return out;
}
/* points EXACTS d'un contact u/v (dichotomie le long des lignes de grille) pour le problème des trois points */
export function contactSamples(geo, u, v) {
  const d = geo.dem, out = [], at = (x, y) => geo.at(x, y);
  for (let j = 1; j < d.H - 1; j += 2) for (let i = 0; i < d.W - 1; i++) {
    const a = at(i, j), b = at(i + 1, j); if (!((a === u && b === v) || (a === v && b === u))) continue;
    let lo = i, hi = i + 1; for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2; if (at(m, j) === a) lo = m; else hi = m; }
    const x = (lo + hi) / 2; out.push({ x, y: j, z: sample(d, x, j) });
  }
  return out;
}
/* trois points bien répartis sur un contact (écart d'altitude ≥ minDz, triangle non dégénéré) */
export function pickThree(samples, minDz = 40) {
  if (samples.length < 6) return null;
  const lo = samples.reduce((m, p) => p.z < m.z ? p : m), hi = samples.reduce((m, p) => p.z > m.z ? p : m);
  if (hi.z - lo.z < minDz) return null;
  const mid = (lo.z + hi.z) / 2; let best = null, bs = -1;
  for (const win of [.12, .22, .3]) {            // d'abord un point franchement à mi-hauteur : l'écart horizontal (d = Δz / tan δ) est alors le plus grand possible
    for (const p of samples) { const area = Math.abs((hi.x - lo.x) * (p.y - lo.y) - (hi.y - lo.y) * (p.x - lo.x)) / 2, inside = Math.abs(p.z - mid) < (hi.z - lo.z) * win; if (inside && area > bs) { bs = area; best = p; } }
    if (best && bs > 40) break; best = null; bs = -1;
  }
  return best && bs > 40 ? [lo, best, hi] : null;
}
/* trois points pour une démonstration : triangle « épais » (jamais quasi aligné), écarts d'altitude francs entre les trois (≥ minDz chacun),
   points espacés d'au moins minSep mailles. Déterministe : parcours des triplets dans l'ordre des échantillons. */
export function pickThreeFat(samples, minDz = 45, minSep = 7) {
  const S = samples.slice().sort((a, b) => a.z - b.z); let best = null, bs = 0;
  for (let i = 0; i < S.length; i++) for (let k = i + 1; k < S.length; k++) {
    if (S[k].z - S[i].z < 2 * minDz) continue;
    for (let j = i + 1; j < k; j++) {
      const a = S[i], b = S[j], c = S[k]; if (b.z - a.z < minDz || c.z - b.z < minDz) continue;
      const dab = Math.hypot(a.x - b.x, a.y - b.y), dbc = Math.hypot(b.x - c.x, b.y - c.y), dac = Math.hypot(a.x - c.x, a.y - c.y); if (Math.min(dab, dbc, dac) < minSep) continue;
      const area = Math.abs((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / 2, per = dab + dbc + dac, fat = area / (per * per);
      if (fat > bs) { bs = fat; best = [a, b, c]; }
    }
  }
  return best;
}
/* section : mêmes régions / contacts sur la grille de la coupe (ids ≥ 0 sous la surface, −1 au-dessus) */
export const sectionRegions = (sec, tol = .3) => gridRegions(sec.g, sec.ns, sec.nz, tol);
export const sectionContact = (sec, u, v, tol = .3) => contactRuns(sec.g, sec.ns, sec.nz, u, v, tol);
export { profileAlong };
