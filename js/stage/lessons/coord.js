/* Thème 3 — COORDONNÉES. 7 scènes ≈ 16 min. Idée centrale : un point = deux nombres (φ puis λ ; X puis Y), avec leurs signes. */
import * as K from '../kit.js';
import { recapFig } from './mission.js';
const { C, txt, line, rect, circ, path, g, arrow, at, badge, tag, lo } = K;

const world = (x0, y0, w, h) => ({ X: lon => x0 + (lon + 180) / 360 * w, Y: lat => y0 + (90 - lat) / 180 * h, x0, y0, w, h });
function graticule(W, o = {}) {
  let s = rect(W.x0, W.y0, W.w, W.h, { fill: '#eef5fb', stroke: C.ink, w: .7 });
  for (let lat = -60; lat <= 60; lat += 30) s += line(W.x0, W.Y(lat), W.x0 + W.w, W.Y(lat), { c: lat ? C.line : C.ink, w: lat ? .4 : .9 });
  for (let lon = -120; lon <= 120; lon += 60) s += line(W.X(lon), W.y0, W.X(lon), W.y0 + W.h, { c: lon ? C.line : C.ink, w: lon ? .4 : .9 });
  if (!o.bare) {
    s += lo([-60, 60].map(l => txt(W.x0 - 1.2, W.Y(l), Math.abs(l) + '°' + (l > 0 ? 'N' : 'S'), { size: 3.4, anchor: 'end', w: 700, fill: C.mute })).join(''));
    s += lo([-120, 0, 120].map(l => txt(W.X(l), W.y0 + W.h + 3.6, (Math.abs(l) || '0') + '°' + (l > 0 ? 'E' : l < 0 ? 'O' : ''), { size: 3.4, w: 700, fill: C.mute })).join(''));
  }
  return s;
}
const fmtLat = (v, nf) => `${nf(Math.abs(v), 1)}° ${v >= 0 ? 'N' : 'S'}`, fmtLon = (v, nf) => `${nf(Math.abs(v), 1)}° ${v >= 0 ? 'E' : 'O'}`;
const PTS = [{ lat: 33.6, lon: -7.6 }, { lat: -9, lon: -59 }, { lat: 48.9, lon: 2.3 }, { lat: -33.9, lon: 151.2 }];
const GRIDP = [{ x: 2.35, y: 1.6 }, { x: 3.7, y: 2.8 }, { x: .8, y: 3.3 }];

export const coord = {
  id: 'coord', title: 'topic.3', seed: 5,
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        const W = world(12, 4, 136, 58), M = PTS[0], x = W.X(M.lon), y = W.Y(M.lat);
        let o = graticule(W) + circ(x, y, 1.9, { fill: C.acc }) + tag(x + 6, y - 4.5, 'M', { size: 5, fill: C.acc });
        /* φ sous le parallèle (à droite), λ le long du méridien (en bas) : jamais sur l'étiquette M, à toute échelle de salle */
        o += at(st, 1, line(W.x0, y, W.x0 + W.w, y, { c: C.blue, w: 1 }) + tag(W.x0 + W.w - 1, y + 3 + 3.6 * K.fsz(), 'φ = ' + fmtLat(M.lat, X.nf), { size: 4.8, fill: C.blue, anchor: 'end' }));
        o += at(st, 2, line(x, W.y0, x, W.y0 + W.h, { c: C.green, w: 1 }) + tag(x + 2.5, W.y0 + W.h - 2 - 3.6 * K.fsz(), 'λ = ' + fmtLon(M.lon, X.nf), { size: 4.8, fill: C.green, anchor: 'start' }));
        return o;
      } },
    { id: 'signs', kind: 'show', steps: 4, min: 3, param: { values: PTS, start: 0, label: (v, i, X) => `${fmtLat(v.lat, X.nf)} · ${fmtLon(v.lon, X.nf)}` },
      fig: (st, pt, X) => {
        const W = world(12, 4, 136, 58);
        let o = graticule(W) + txt(W.X(-90), W.Y(0) - 3, X.t('coord.eq'), { size: 3.8, w: 800 }) + txt(W.X(0) + 16, W.y0 + W.h - 3.6, X.t('coord.gw'), { size: 3.8, w: 800 });
        /* O/E sur la bande du haut, N/S plus bas à droite : séparés d'au moins une hauteur d'étiquette, même agrandis (salle, 4:3) */
        const th = 5.4 * K.fsz() * 1.5, yOE = W.y0 + th / 2 + .5, yN = Math.max(W.Y(45), yOE + th + 1), yS = Math.min(W.Y(-45), W.y0 + W.h - th / 2 - 6);
        o += at(st, 1, tag(130, yN, 'N  ( + )', { size: 5.4, fill: C.blue }) + tag(130, yS, 'S  ( − )', { size: 5.4, fill: C.brown }), { fade: true });
        o += at(st, 2, tag(W.X(-95), yOE, 'O  ( − )', { size: 5.4, fill: C.brown }) + tag(W.X(95), yOE, 'E  ( + )', { size: 5.4, fill: C.blue }), { fade: true });
        o += at(st, 3, line(W.x0, W.Y(pt.lat), W.x0 + W.w, W.Y(pt.lat), { c: C.blue, w: .8, dash: '2 1.4' }) + line(W.X(pt.lon), W.y0, W.X(pt.lon), W.y0 + W.h, { c: C.green, w: .8, dash: '2 1.4' }) + circ(W.X(pt.lon), W.Y(pt.lat), 2, { fill: C.acc }));
        return o;
      } },
    { id: 'grid', kind: 'build', steps: 4, min: 3, param: { values: GRIDP, start: 0, label: (v, i, X) => X.t('coord.pos', { n: i + 1 }) },
      fig: (st, p, X) => {
        const x0 = 14, y0 = 3, cs = 14.5, cols = 5, rows = 4, px = x0 + p.x * cs, py = y0 + (rows - p.y) * cs, X0 = 456, Y0 = 320;
        let o = rect(x0, y0, cols * cs, rows * cs, { fill: '#f6f1e2', stroke: C.ink, w: .8 });
        for (let i = 1; i < cols; i++) o += line(x0 + i * cs, y0, x0 + i * cs, y0 + rows * cs, { c: C.line, w: .4 });
        for (let j = 1; j < rows; j++) o += line(x0, y0 + j * cs, x0 + cols * cs, y0 + j * cs, { c: C.line, w: .4 });
        for (let i = 0; i <= cols; i += 1) o += txt(x0 + i * cs, y0 + rows * cs + 3.6, String(X0 + i), { size: 3.6, w: 700 });
        for (let j = 0; j <= rows; j++) o += txt(x0 - 1.4, y0 + (rows - j) * cs, String(Y0 + j), { size: 3.6, anchor: 'end', w: 700 });
        o += circ(px, py, 1.9, { fill: C.acc }) + tag(px + 5.5, py - 3.6, 'P', { size: 4.6, fill: C.acc });
        const xv = X0 + p.x, yv = Y0 + p.y;
        /* colonne de droite empilée d'après les tailles réelles (salle, 4:3) : étiquette, consigne, étiquette, consigne, résultat — sans chevauchement ni débord sur la grille */
        const fs = K.fsz(), ts = Math.min(6.4, 8.4 / fs), hT = ts * fs * 1.5, ns = 4.2 * fs, cx = 88 + (158 - 88) / 2;
        const y1 = 3 + hT / 2, n1 = y1 + hT / 2 + .7 * ns, y2 = n1 + .7 * ns + 1.5 + hT / 2, n2 = y2 + hT / 2 + .7 * ns, yb = Math.min(57, Math.max(52, n2 + .7 * ns + 1));
        o += at(st, 1, line(px, py, px, y0 + rows * cs, { c: C.blue, w: .9 }) + tag(cx, y1, 'X = ' + X.nf(xv, 2) + ' km', { size: ts, fill: C.blue }) + txt(cx, n1, X.t('coord.right'), { size: 4.2, fill: C.mute, w: 600 }));
        o += at(st, 2, line(px, py, x0, py, { c: C.red, w: .9 }) + tag(cx, y2, 'Y = ' + X.nf(yv, 2) + ' km', { size: ts, fill: C.red }) + txt(cx, n2, X.t('coord.up'), { size: 4.2, fill: C.mute, w: 600 }));
        o += at(st, 3, rect(cx - 33, yb, 66, 12, { fill: '#fff6d6', stroke: C.ink, w: .6, rx: 2 }) + txt(cx, yb + 6.2, `P ( ${X.nf(xv, 2)} ; ${X.nf(yv, 2)} )`, { size: 4.6, w: 800 }));
        return o;
      } },
    { id: 'v1', kind: 'vote', min: 2,
      vote: { opts: [{ mis: 'c-ns' }, { ok: true }, { mis: 'c-both' }, { mis: 'c-eo' }],
        draw: (st, X) => { const W = world(6, 8, 78, 52); let o = graticule(W, { bare: true }); [['A', 40, 60], ['B', -40, -60], ['C', 40, -60], ['D', -40, 60]].forEach(([l, la, lo_]) => { o += badge(W.X(lo_), W.Y(la), l, { r: 3, fill: C.acc }); }); return o + txt(45, 4.6, X.t('coord.v1.top'), { size: 4.6, w: 800 }); } },
      q: 1 },
    { id: 'pr', kind: 'practice', min: 3, practice: { ch: 'coord', seconds: 90 } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1,
      fig: (st, p, X) => recapFig('coord', st, X) }
  ]
};
export const FR = {
  'topic.3': 'Coordonnées', 'topic.3.d': 'Latitude, longitude, grille kilométrique',
  'coord.eq': 'Équateur 0°', 'coord.gw': 'Greenwich 0°', 'coord.pos': 'Point {n}', 'coord.right': '→ lire vers la droite', 'coord.up': '↑ lire vers le haut',
  'coord.v1.top': 'Hémisphère Sud et Ouest ?',
  'coord.recap.r0': 'Latitude φ : N + / S −', 'coord.recap.r1': 'Longitude λ : E + / O −', 'coord.recap.r2': 'Grille : X puis Y',
  'coord.hook.claim': 'Deux nombres situent un point',
  'coord.hook.c0': 'Où est **M** sur le globe ?',
  'coord.hook.c1': 'Le **parallèle** donne la latitude φ.',
  'coord.hook.c2': 'Le **méridien** donne la longitude λ.',
  'coord.hook.note': 'M = Casablanca. Tracer d’abord la ligne horizontale, puis la verticale.', 'coord.hook.ask': 'Pourquoi deux nombres, pas un ?',
  'coord.signs.claim': 'Les signes comptent',
  'coord.signs.c0': 'Deux lignes de référence : **équateur** et **Greenwich**.',
  'coord.signs.c1': 'Latitude : **Nord +**, Sud −.',
  'coord.signs.c2': 'Longitude : **Est +**, Ouest −.',
  'coord.signs.c3': 'Changez de point avec ↑ ↓ : lisez φ puis λ.',
  'coord.signs.note': 'Faire nommer le quadrant avant d’afficher la notation.', 'coord.signs.ask': 'Quel signe pour 59° Ouest ?',
  'coord.grid.claim': 'Lire une grille kilométrique',
  'coord.grid.c0': 'Un carré = **1 km**. Les valeurs sont écrites sur les bords.',
  'coord.grid.c1': 'D’abord **X** : vers la droite.',
  'coord.grid.c2': 'Puis **Y** : vers le haut.',
  'coord.grid.c3': 'On écrit **(X ; Y)**, jamais l’inverse.',
  'coord.grid.note': 'Estimer la fraction de carré à l’œil avant de donner la valeur.', 'coord.grid.ask': 'Que vaut 0,5 carré en mètres ?',
  'coord.v1.claim': 'Quel point ?', 'coord.v1.q': 'Quel point est au Sud et à l’Ouest ?',
  'coord.v1.c0': 'Repérez l’hémisphère puis le côté.', 'coord.v1.c1': 'Votez : A, B, C ou D.',
  'coord.v1.o0': '40° N · 60° O', 'coord.v1.o1': '40° S · 60° O', 'coord.v1.o2': '40° N · 60° E', 'coord.v1.o3': '40° S · 60° E',
  'coord.v1.sol': 'Sud ⇒ φ négative ; Ouest ⇒ λ négative.', 'coord.v1.note': 'Chaque mauvaise réponse a une cause différente : les nommer.', 'coord.v1.ask': 'Pourquoi hésiter entre B et D ?',
  'coord.pr.claim': 'À vous de jouer', 'coord.pr.c0': 'Lisez l’énoncé.', 'coord.pr.c1': 'Calculez : le minuteur tourne.', 'coord.pr.c2': 'Correction.', 'coord.pr.note': 'Même moteur d’exercices que l’espace élève.', 'coord.pr.ask': 'Qui a changé les deux signes ?',
  'coord.recap.claim': 'À retenir', 'coord.recap.c0': 'Trois idées.', 'coord.recap.note': 'Faire reformuler.', 'coord.recap.ask': 'Antipode de 10° N, 20° E ?',
  'mis.c-ns': 'Nord/Sud confondus', 'mis.c-ns.why': 'Sud ⇒ latitude négative : 40° N est dans l’hémisphère opposé.',
  'mis.c-both': 'Deux signes oubliés', 'mis.c-both.why': 'N et E sont positifs : ce point est au Nord-Est.',
  'mis.c-eo': 'Est/Ouest confondus', 'mis.c-eo.why': 'Ouest ⇒ longitude négative : 60° E est de l’autre côté de Greenwich.'
};
