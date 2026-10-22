/* Thème 10 — CARTES GÉOLOGIQUES. 15 scènes ≈ 38 min. Idée centrale : un géologue ne « lit » pas une carte colorée, il RAISONNE :
   couleur = formation (pas altitude) · contact qui croise les courbes ⇒ couche inclinée · trois points ⇒ direction et pendage · pendage ⇒ sens du temps · recoupement ⇒ âge relatif.
   Tout vient du moteur Géologie : régions, contacts, trois points (vérifiés par planeFrom3) — aucune géométrie n'est dessinée à la main.
   Principe de la leçon : on PRÉDIT (vote) avant d'expliquer, on DÉMONTRE (construction pas à pas) avant d'énoncer la règle. */
import * as K from '../kit.js';
import { dipDirectionCandidates } from '../../engine/geology/index.js';
import { toMap, levelPaths } from './maps.js';
import { geoMapSvg, legendSvg, timeArrow, dipSymbol, mapPt, contactMid, azArrow, callout, toward, top } from './geomap.js';
import { missionGeo, demoGeo, galerie, exoGeo, extremes, walkLine, BOX, WIN } from './geoworld.js';
import { recapFig, extras, dirName, missionMap, MAP } from './mission.js';
const { C, txt, line, rect, circ, path, poly, arrow, at, badge, tag } = K;

extras.geo = missionGeo;

const CX = 132;                                   // centre de la colonne de droite (x 107 → 157)
/* bulle de la colonne de droite, sous la légende (qui occupe y < 39,5) : elle ne monte jamais au-dessus de y = 41 ; son texte rétrécit au besoin */
const callCol = (label, o = {}) => callout(CX, 57, label, { top: 41, ...o });
const RAD = Math.PI / 180;
/* intersection d'une droite (P + t·s) avec le rectangle du MNT, en coordonnées MNT */
function clipRay(P, s, W, H) {
  let t0 = -1e9, t1 = 1e9; const lim = (p, d, a, b) => { if (Math.abs(d) < 1e-9) return; const u = (a - p) / d, v = (b - p) / d; t0 = Math.max(t0, Math.min(u, v)); t1 = Math.min(t1, Math.max(u, v)); };
  lim(P.x, s.x, 1, W - 2); lim(P.y, s.y, 1, H - 2);
  return [{ x: P.x + s.x * t0, y: P.y + s.y * t0 }, { x: P.x + s.x * t1, y: P.y + s.y * t1 }];
}
/* flèche du temps le long des seules formations sédimentaires de la légende (les roches magmatiques sont posées à part) */
function legendArrow(g, label) { const n = g.ord.length, ns = g.ord.filter(u => !g.geo.units[u].ign).length, ch = 36 / n; return timeArrow(139, 5, 3.5 + ns * ch - 1.5, label); }
const legend = (g, hl) => legendSvg(g, 107, 3.5, 24, 36, { hl });
const VB = { x: 4, y: 14, w: 80, h: 55 };       // boîte de carte dans un vote (les cartes de réponse occupent x ≥ 90)
const pt = (g, box, p, r = 1.5, fill = C.ink) => { const q = mapPt(g, box, p); return circ(q[0], q[1], r, { fill, stroke: '#fff', w: .5 }); };
const other = (g, keep) => new Set(g.geo.units.map((u, i) => i).filter(i => !keep.includes(i)));
/* l'unité dont les affleurements couvrent le plus grand écart d'altitude (pour « une couleur n'est pas une altitude ») */
function widest(g) { let b = null; g.geo.units.forEach((u, i) => { const e = extremes(g, i); if (e && (!b || e.hi.z - e.lo.z > b.dz)) b = { u: i, dz: e.hi.z - e.lo.z, e }; }); return b; }

const tp = () => demoGeo().tp;
/* LOUPE : grossit la carte autour du triangle des trois points (clip + transformation). zp(p) : point MNT → repère de la figure grossie.
   k = 1 (id) : pas de zoom — la carte entière, pour que l'élève sache d'où vient le zoom. */
function loupe(M, T, box, o = {}) {
  const f = q => mapPt(M, box, q), P = [...T.p, T.Q].map(f), xs = P.map(q => q[0]), ys = P.map(q => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), bx = box.x + box.w / 2, by = box.y + box.h / 2;
  const k = o.id ? 1 : Math.max(1, Math.min(o.kmax || 4.2, .62 * box.w / Math.max(x1 - x0, 1), .62 * box.h / Math.max(y1 - y0, 1))), c = o.id ? [bx, by] : [(x0 + x1) / 2, (y0 + y1) / 2];
  /* la carte grossie doit toujours recouvrir la boîte (pas de bande blanche au bord du MNT) */
  const tx = Math.min(box.x - box.x * k, Math.max(box.x + box.w - (box.x + box.w) * k, bx - c[0] * k)), ty = Math.min(box.y - box.y * k, Math.max(box.y + box.h - (box.y + box.h) * k, by - c[1] * k));
  const Z = q => [q[0] * k + tx, q[1] * k + ty], id = 'gcl' + Math.round(box.x * 7 + box.w) + (o.id ? 'a' : 'b');
  return { k, Z, zp: p => Z(f(p)), bx, by,
    wrap: (mapInner, overlay) => K.el('clipPath', { id }, rect(box.x, box.y, box.w, box.h)) + K.el('g', { 'clip-path': `url(#${id})` }, K.el('g', { transform: `translate(${tx} ${ty}) scale(${k})` }, mapInner) + overlay) + rect(box.x, box.y, box.w, box.h, { fill: 'none', stroke: C.ink, w: .6 }) };
}
/* barre d'échelle : la plus grande longueur « ronde » qui tient dans 32 unités */
function scaleBar(d, k, box, avoid) {
  const u = 1 / d.cellM * box.w / (d.W - 1) * k, m = [1000, 500, 200, 100].find(v => v * u <= 32) || 100, L = m * u, y = box.y + box.h - 4;
  /* avoid : points de la carte à ne pas recouvrir (les trois points) — la barre passe dans le coin du bas le plus éloigné d'eux */
  const right = avoid && avoid.length && avoid.reduce((a, q) => a + q[0], 0) / avoid.length < box.x + box.w / 2, x = right ? box.x + box.w - 4 - L : box.x + 4;
  return line(x, y, x + L, y, { c: C.ink, w: 1.1 }) + txt(x + L / 2, y - 3.2, m >= 1000 ? '1 km' : m + ' m', { size: 3.8, w: 800 });
}
const tagSide = (L, q, z, dy = 0, fill = C.blue, size = 4.6, left = false) => { return tag(q[0] + (left ? -3 : 3), q[1] + dy, z, { size, anchor: left ? 'end' : 'start', fill }); };
/* trois étiquettes d'altitude (au-dessus / à côté / au-dessous du point), puis écartées si elles se chevauchent : à forte échelle de salle ou en 4:3
   le texte grossit et « 477 m » recouvrait « 876 m » (audit v3.1) */
function threeTags(pts, labels, dy, fills, size) {
  const spec = pts.map((q, i) => ({ x: q[0] + (i === 1 ? -3 : 3), y: q[1] + (i === 1 ? 0 : i === 0 ? dy : -dy), s: labels[i], o: { size, anchor: i === 1 ? 'end' : 'start' } })), ys = K.declutter(spec);
  return spec.map((a, i) => tag(a.x, ys[i], a.s, { size, anchor: a.o.anchor, fill: fills[i] })).join('');
}
/* triangle du pendage : Δz vertical, d horizontal, angle δ (dessiné à l'échelle du rapport Δz/d) */
function dipTriangle(T, X, x0, y0, bw) {
  const bh = bw * T.dz / T.d, a = Math.atan2(bh, bw);
  return poly([[x0, y0], [x0 + bw, y0], [x0 + bw, y0 - bh]], { close: true, fill: '#fdf3e3', stroke: C.ink, w: .9 }) + line(x0 + bw - 2, y0, x0 + bw - 2, y0 - 2, { c: C.ink, w: .5 }) + line(x0 + bw - 2, y0 - 2, x0 + bw, y0 - 2, { c: C.ink, w: .5 }) +
    path(`M${x0 + 9} ${y0}A9 9 0 0 0 ${x0 + 9 * Math.cos(a)} ${y0 - 9 * Math.sin(a)}`, { stroke: C.acc, w: .9 }) +
    txt(x0 + bw / 2, y0 + 4.4, 'd', { size: 4.6, w: 800 }) + txt(x0 + bw + 3, y0 - bh / 2, 'Δz', { size: 4.6, w: 800, anchor: 'start' });
}
/* courbes de niveau par-dessus une carte géologique : traits blancs en tirets, pour qu'on les voie là où un contact les recouvre */
function eqOver(g, box, eq, labels) {
  let o = ''; const f = x => x;
  for (const lv of levelPaths(g.geo.dem, eq, box)) {
    o += path(lv.d, { stroke: '#ffffff', w: .8, dash: '2.2 1.4' });
    if (labels) { const ch = lv.chains.reduce((m, c) => !m || c.length > m.length ? c : m, null); if (ch) { const q = ch.find((r, i) => i > ch.length * .3 && r[0] > box.x + 8 && r[0] < box.x + box.w - 8 && r[1] > box.y + 5 && r[1] < box.y + box.h - 5) ; if (q) o += txt(q[0], q[1], String(lv.level), { size: 3.8, w: 800 }); } }
  }
  return o;
}
export const geocarte = {
  id: 'geocarte', thread: true, title: 'topic.10', seed: 4,
  scenes: [
    { id: 'hook', step: 'observe', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        const M = missionGeo(), m = M.m;
        if (st < 2) {
          const MM = missionMap(m, { labels: false, quiet: true }), mp = toMap(MAP, m.d), q0 = mp({ x: WIN.x0, y: WIN.y0 }), q1 = mp({ x: WIN.x0 + WIN.w - 1, y: WIN.y0 + WIN.h - 1 });
          return MM.svg + MM.ab(1.1) + at(st, 1, rect(q0[0], q0[1], q1[0] - q0[0], q1[1] - q0[1], { fill: 'none', stroke: C.acc, w: 1.5 })) + (st === 0 ? callout(CX, 34, X.t('geocarte.hook.t0')) : callout(CX, 34, X.t('geocarte.hook.t1')));
        }
        const a = mapPt(M, BOX, M.A), b = mapPt(M, BOX, M.B);
        return geoMapSvg(M, BOX, {}) + line(a[0], a[1], b[0], b[1], { c: C.acc, w: 1.2 }) + badge(a[0], a[1], 'A', { r: 2.8, fill: C.acc, quiet: true }) + badge(b[0], b[1], 'B', { r: 2.8, fill: C.acc, quiet: true }) + at(st, 2, callout(CX, 34, X.t('geocarte.hook.t2'), { fill: C.acc }));
      } },
    { id: 'v1', step: 'observe', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-couleur-alt' }, { mis: 'g-couleur-veg' }, { mis: 'g-couleur-prof' }],
        draw: (st, X) => geoMapSvg(missionGeo(), VB, {}) + top(X.t('geocarte.v1.top')) },
      q: 1 },
    { id: 'legende', step: 'observe', kind: 'show', steps: 4, min: 3,
      fig: (st, p, X) => {
        const M = missionGeo(), W = widest(M), hl = st >= 2 ? new Set([W.u]) : null;
        let o = geoMapSvg(M, BOX, { labels: st < 2, only: st >= 2 ? W.u : null }) + legend(M, hl);
        o += at(st, 1, legendArrow(M, X.t('geocarte.time')), { rest: true });
        if (st >= 2) {
          const lo = mapPt(M, BOX, W.e.lo), hi = mapPt(M, BOX, W.e.hi);
          o += at(st, 2, circ(lo[0], lo[1], 1.6, { fill: '#fff', stroke: C.ink, w: .7 }) + circ(hi[0], hi[1], 1.6, { fill: '#fff', stroke: C.ink, w: .7 }) +
            tag(lo[0] + 3, lo[1] - 4, `${X.nf(W.e.lo.z, 0)} m`, { size: 4.6, anchor: 'start', fill: C.blue }) + tag(hi[0] + 3, hi[1] + 4, `${X.nf(W.e.hi.z, 0)} m`, { size: 4.6, anchor: 'start', fill: C.blue }), { rest: st > 2 });
        }
        o += st === 1 ? at(st, 1, callCol(X.t('geocarte.legende.t1'))) : st === 2 ? at(st, 2, callCol(X.t('geocarte.legende.t2'), { fill: C.acc })) : st === 3 ? at(st, 3, callCol(X.t('geocarte.legende.t3'), { fill: C.pri })) : '';
        return o;
      } },
    { id: 'contact', step: 'locate', kind: 'show', steps: 2, min: 2,
      fig: (st, p, X) => {
        const M = missionGeo(), only = st >= 1;
        let o = geoMapSvg(M, BOX, { dim: only ? other(M, [M.tp.u, M.tp.v]) : null, contact: only ? [M.tp.u, M.tp.v] : null, labels: true }) + legend(M, only ? new Set([M.tp.u, M.tp.v]) : null);
        o += st === 0 ? at(st, 0, callCol(X.t('geocarte.contact.t0'))) : at(st, 1, callCol(X.t('geocarte.contact.t1'), { fill: C.acc }));
        return o;
      } },
    { id: 'horiz', step: 'locate', kind: 'show', steps: 2, min: 2,
      fig: (st, p, X) => {
        const G = galerie('tabulaire'), cm = contactMid(G, BOX, 1, 2);
        let o = geoMapSvg(G, BOX, { labels: false }) + (st >= 1 ? eqOver(G, BOX, 100, true) : '') + legend(G, null);
        o += st === 0 ? at(st, 0, callCol(X.t('geocarte.horiz.t0'))) : at(st, 1, callCol(X.t('geocarte.horiz.t1'), { fill: C.acc }));
        return o;
      } },
    { id: 'v2', step: 'locate', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-horiz-incl' }, { mis: 'g-horiz-vert' }, { mis: 'g-horiz-rien' }],
        draw: (st, X) => { const G = galerie('tabulaire'); return geoMapSvg(G, VB, { contact: [1, 2] }) + eqOver(G, VB, 100, false) + top(X.t('geocarte.v2.top')); } },
      q: 1 },
    { id: 'dip', step: 'measure', kind: 'build', steps: 6, min: 4,
      fig: (st, p, X) => {
        const M = demoGeo(), T = M.tp, d = M.geo.dem, L = loupe(M, T, BOX, { id: st === 0 }), zp = L.zp, ST = T.p[1];
        const [p1, p2, p3] = T.p.map(zp), Q = zp(T.Q), sx = Math.sin(T.strikeAz * RAD), sy = -Math.cos(T.strikeAz * RAD), [e0, e1] = clipRay(ST, { x: sx, y: sy }, d.W, d.H).map(zp);
        const t = (T.p[0].x - ST.x) * sx + (T.p[0].y - ST.y) * sy, F = zp({ x: ST.x + sx * t, y: ST.y + sy * t }), mid = [(p2[0] + Q[0]) / 2, (p2[1] + Q[1]) / 2];
        const map = geoMapSvg(M, BOX, { dim: other(M, [T.u, T.v]), contact: [T.u, T.v], hlW: 1.3 / L.k, contactW: .45, eq: 40, eqOp: .4 });
        let inner = at(st, 2, line(p1[0], p1[1], p3[0], p3[1], { c: C.ink, w: .6, dash: '1.5 1.2' }), { rest: st > 2 }) + at(st, 3, line(e0[0], e0[1], e1[0], e1[1], { c: C.acc, w: 1.4 })) +
          at(st, 4, azArrow(mid[0], mid[1], T.dipAz, 15, { c: C.ink, w: 2, head: 5 }), { rest: st > 4 }) + at(st, 5, line(F[0], F[1], p1[0], p1[1], { c: C.ink, w: 1.3, dash: '1.6 1' }));
        let o = L.wrap(map, inner);
        o += at(st, 1, [p1, p2, p3].map(q => circ(q[0], q[1], 1.6, { fill: C.ink, stroke: '#fff', w: .5 })).join('') + threeTags([p1, p2, p3], T.p.map(p => `${X.nf(p.z, 0)} m`), 4, [C.blue, C.blue, C.blue], 4.6), { rest: st > 1 });
        o += at(st, 2, circ(Q[0], Q[1], 1.9, { fill: C.gold, stroke: C.ink, w: .6 }) + tagSide(L, Q, `${X.nf(T.p[1].z, 0)} m`, 4.6, C.ink), { rest: st > 2 });
        o += st === 0 ? at(st, 0, callout(CX, 34, X.t('geocarte.dip.t1'))) : st === 2 ? at(st, 2, callout(CX, 34, X.t('geocarte.dip.t2'))) : st === 3 ? at(st, 3, callout(CX, 34, X.t('geocarte.dip.t3'))) : st === 4 ? at(st, 4, callout(CX, 34, X.t('geocarte.dip.t4', { dir: toward(T.dipAz) }), { fill: C.acc })) : '';
        if (st >= 1) o += scaleBar(d, L.k, BOX, [p1, p2, p3]);
        o += at(st, 5, rect(107, 3, 50, 44, { fill: C.soft, stroke: C.ink, w: .5, rx: 2 }) + txt(CX, 8, `Δz = ${X.nf(T.dz, 0)} m`, { size: 3.8, w: 800 }) + txt(CX, 14, `d = ${X.nf(T.d, 0)} m`, { size: 3.8, w: 800 }) + dipTriangle(T, X, 113, 37, 26) + txt(126, 33.2, `${X.nf(T.dip, 0)}°`, { size: 6.6, fill: C.acc, w: 800 }));
        o += st === 5 ? at(st, 5, callCol(X.t('geocarte.dip.t5'), { fill: C.pri })) : '';
        return o;
      } },
    { id: 'v3', step: 'measure', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-dipsens' }, { mis: 'g-dipstrike' }, { mis: 'g-dipterrain' }],
        label: (i, X) => { const T = tp(); return i === 3 ? X.t('geocarte.v3.o3') : 'Vers ' + toward(i === 0 ? T.dipAz : i === 1 ? T.dipAz + 180 : T.strikeAz); },
        draw: (st, X) => {
          const M = demoGeo(), T = M.tp, d = M.geo.dem, L = loupe(M, T, VB), sx = Math.sin(T.strikeAz * RAD), sy = -Math.cos(T.strikeAz * RAD), [e0, e1] = clipRay(T.p[1], { x: sx, y: sy }, d.W, d.H).map(L.zp);
          const [p1, p2, p3] = T.p.map(L.zp), map = geoMapSvg(M, VB, { dim: other(M, [T.u, T.v]), contact: [T.u, T.v], hlW: 1.3 / L.k, contactW: .45, eq: 40, eqOp: .4 });
          /* QUATRE FLÈCHES lettrées issues d'un même point (engine/geology/distractors.js) : le vrai sens du pendage, son inverse, la direction du contact et la pente du terrain.
             Les altitudes (contexte) deviennent discrètes (quiet) : l'attention va aux quatre options. */
          /* origine des flèches : parmi les points lisibles, celui dont les lettres gênent le moins les étiquettes d'altitude (et qui reste dans la carte) ; les quatre
             flèches restent écartées d'au moins 25° (le moteur le garantit pour chaque origine). */
          const tagBoxes = [p1, p2, p3].map((q, i) => K.tagBox(q[0] + (i === 1 ? -3 : 3), q[1] + (i === 1 ? 0 : i === 0 ? 3.6 : -3.6), `${X.nf(T.p[i].z, 0)} m`, { size: 4.2, anchor: i === 1 ? 'end' : 'start' }));
          const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), cen = { x: (T.p[0].x + T.p[1].x + T.p[2].x) / 3, y: (T.p[0].y + T.p[1].y + T.p[2].y) / 3 };
          const ARROW = 12, tips = (cd, o0) => cd.candidates.map(cn => { const dx = Math.sin(cn.az * RAD), dy = -Math.cos(cn.az * RAD); return [o0[0] + dx * (ARROW + 4), o0[1] + dy * (ARROW + 4)]; });
          const crowd = (cd, o0) => tips(cd, o0).reduce((n, q) => n + tagBoxes.filter(b => q[0] + 3.4 > b.x0 && q[0] - 3.4 < b.x0 + b.w && q[1] + 3.4 > b.y0 && q[1] - 3.4 < b.y0 + b.h).length + (q[0] < VB.x + 3.4 || q[0] > VB.x + VB.w - 3.4 || q[1] < VB.y + 3.4 || q[1] > VB.y + VB.h - 3.4 ? 5 : 0), 0);
          let pick = null;
          [cen, T.Q, mid(T.p[0], T.p[2]), mid(T.p[0], T.p[1]), T.p[1]].forEach(o => { const cd = dipDirectionCandidates({ dipAz: T.dipAz, strikeAz: T.strikeAz, dem: d, origins: [o] }), o0 = L.zp(cd.origin); if (!cd.ok) return; const sc = crowd(cd, o0); if (!pick || sc < pick.sc) pick = { cd, o0, sc }; });
          if (!pick) { const cd = dipDirectionCandidates({ dipAz: T.dipAz, strikeAz: T.strikeAz, dem: d, origins: [cen, T.Q, T.p[1]] }); pick = { cd, o0: L.zp(cd.origin) }; }
          const { cd, o0 } = pick, letter = X.letterOf || (c => 'ABCD'[c]);
          const arrows = cd.candidates.map((cn, c) => { const dx = Math.sin(cn.az * RAD), dy = -Math.cos(cn.az * RAD), ex = o0[0] + dx * ARROW, ey = o0[1] + dy * ARROW;
            return arrow(o0[0], o0[1], ex, ey, { c: '#fff', w: 3.8, head: 6.4 }) + arrow(o0[0], o0[1], ex, ey, { c: C.ink, w: 1.8, head: 4.4 }) + badge(ex + dx * 4, ey + dy * 4, letter(c), { r: 3.2, fill: C.ink, size: 4.4 }); }).join('');
          return L.wrap(map, line(e0[0], e0[1], e1[0], e1[1], { c: C.acc, w: 1.4 })) + [p1, p2, p3].map(q => circ(q[0], q[1], 1.5, { fill: C.ink, stroke: '#fff', w: .5 })).join('') + K.quiet(threeTags([p1, p2, p3], T.p.map(p => `${X.nf(p.z, 0)} m`), 3.6, [C.blue, C.ink, C.blue], 4.2)) + circ(o0[0], o0[1], 1.4, { fill: '#fff', stroke: C.ink, w: .6 }) + arrows +
            arrow(VB.x + VB.w - 6, VB.y + 11, VB.x + VB.w - 6, VB.y + 4, { c: C.ink, w: 1, head: 2.4 }) + txt(VB.x + VB.w - 10, VB.y + 5, 'N', { size: 4, w: 800 }) + top(X.t('geocarte.v3.top', { z: X.nf(T.p[1].z, 0) }));
        } },
      q: 1 },
    { id: 'age', step: 'date', kind: 'show', steps: 4, min: 3,
      fig: (st, p, X) => {
        const M = missionGeo(), W = walkLine(M, M.dipAz), a = mapPt(M, BOX, W.a), b = mapPt(M, BOX, W.b);
        let o = geoMapSvg(M, BOX, { labels: true }) + legend(M, null);
        o += at(st, 1, arrow(a[0], a[1], b[0], b[1], { c: C.acc, w: 1.5, head: 3.6 }), { rest: st > 1 });
        o += at(st, 2, legendArrow(M, X.t('geocarte.time')), { rest: st > 2 });
        o += st === 0 ? at(st, 0, callCol(X.t('geocarte.age.t0'))) : st === 1 ? at(st, 1, callCol(X.t('geocarte.age.t1', { dir: toward(M.dipAz) }))) : st === 2 ? at(st, 2, callCol(X.t('geocarte.age.t2'), { fill: C.acc })) : at(st, 3, callCol(X.t('geocarte.age.t3'), { fill: C.pri }));
        return o;
      } },
    { id: 'v4', step: 'date', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-agesens' }, { mis: 'g-agememe' }, { mis: 'g-agerelief' }],
        draw: (st, X) => {
          const M = missionGeo(), W = walkLine(M, M.dipAz), a = mapPt(M, VB, W.a), b = mapPt(M, VB, W.b);
          return geoMapSvg(M, VB, { labels: true }) + arrow(a[0], a[1], b[0], b[1], { c: C.acc, w: 1.5, head: 3.6 }) + top(X.t('geocarte.v4.top', { dir: toward(M.dipAz) }));
        } },
      q: 1 },
    { id: 'recoup', step: 'date', kind: 'show', steps: 3, min: 3,
      fig: (st, p, X) => {
        const G = galerie('filon'), fi = G.geo.units.findIndex(u => u.ign);
        let o = geoMapSvg(G, BOX, { labels: true, only: st >= 1 ? fi : null }) + legend(G, st >= 1 ? new Set([fi]) : null);
        o += st === 0 ? at(st, 0, callCol(X.t('geocarte.recoup.t0'))) : st === 1 ? at(st, 1, callCol(X.t('geocarte.recoup.t1'))) : at(st, 2, callCol(X.t('geocarte.recoup.t2'), { fill: C.acc }));
        return o;
      } },
    { id: 'struct', step: 'suppose', kind: 'show', steps: 6, min: 4,
      fig: (st, p, X) => {
        const kinds = ['tabulaire', 'monoclinal', 'anticlinal', 'synclinal', 'discordance', 'granite'], k = kinds[st], G = galerie(k);
        return geoMapSvg(G, BOX, { eq: G.eq, eqOp: .35 }) + legend(G, null) + legendArrow(G, X.t('geocarte.time')) + callCol(X.t('geocarte.sig.' + k), { fill: k === 'anticlinal' || k === 'synclinal' ? C.acc : C.ink });
      } },
    { id: 'v5', step: 'suppose', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'g-pli-inv' }, { mis: 'g-pli-mono' }, { mis: 'g-pli-disc' }],
        draw: (st, X) => { const G = galerie('anticlinal'), box = { x: 2, y: 13, w: 66, h: 45.5 }; return geoMapSvg(G, box, {}) + legendSvg(G, 72, 13, 13, 45) + txt(78.5, 10.4, X.t('geocarte.v5.young'), { size: 3.6, w: 700, fill: C.mute }) + txt(78.5, 61.6, X.t('geocarte.v5.old'), { size: 3.6, w: 700, fill: C.mute }) + top(X.t('geocarte.v5.top')); } },
      q: 1 },
    { id: 'pr', step: 'measure', kind: 'practice', min: 5, practice: { seconds: 240, draw: true },
      fig: (st, p, X) => {
        const E = exoGeo(), T = E.tp, d = E.geo.dem, L = loupe(E, T, BOX), zp = L.zp, sx = Math.sin(T.strikeAz * RAD), sy = -Math.cos(T.strikeAz * RAD);
        const map = geoMapSvg(E, BOX, { eq: 40, eqOp: .5, contact: [T.u, T.v], hlW: 1 / L.k, contactW: .45 }), pts = T.p.map(zp);
        const [e0, e1] = clipRay(T.p[1], { x: sx, y: sy }, d.W, d.H).map(zp), c = zp(T.Q), mid = [(pts[1][0] + c[0]) / 2, (pts[1][1] + c[1]) / 2];
        let o = L.wrap(map, st >= 2 ? line(e0[0], e0[1], e1[0], e1[1], { c: C.acc, w: 1.4 }) + azArrow(mid[0], mid[1], T.dipAz, 15, { c: C.ink, w: 2, head: 5 }) : '');
        o += at(st, 0, pts.map(q => circ(q[0], q[1], 1.6, { fill: C.ink, stroke: '#fff', w: .5 })).join('') + threeTags(pts, T.p.map(p => `${X.nf(p.z, 0)} m`), 4, [C.blue, C.blue, C.blue], 4.6), { rest: true });
        o += scaleBar(d, L.k, BOX, pts);
        return st < 2 ? o : o + callout(CX, 30, X.t('geocarte.pr.t2', { dip: X.nf(T.dip, 0), dir: toward(T.dipAz), sz: X.nf(T.strikeAz, 0) }), { fill: C.pri });
      } },
    { id: 'recap', step: 'all', kind: 'recap', steps: 4, min: 1, fig: (st, p, X) => recapFig('geocarte', st, X) }
  ]
};

const sc = (id, claim, cs, note, ask) => Object.fromEntries([[`geocarte.${id}.claim`, claim], ...cs.map((c, i) => [`geocarte.${id}.c${i}`, c]), [`geocarte.${id}.note`, note], [`geocarte.${id}.ask`, ask]]);
const vt = (id, claim, q, opts, sol, note, ask) => ({ ...sc(id, claim, ['Réfléchissez 20 secondes, sans parler.', 'Votez : A, B, C ou D.'], note, ask), [`geocarte.${id}.q`]: q, ...Object.fromEntries(opts.map((o, i) => [`geocarte.${id}.o${i}`, o]).filter(e => e[1])), [`geocarte.${id}.sol`]: sol });

export const FR = {
  'topic.10': 'Cartes géologiques', 'topic.10.d': 'Contacts, pendage, âges relatifs, structures',
  'geocarte.time': 'plus récent', 'geocarte.v5.young': 'récent', 'geocarte.v5.old': 'ancien',
  'geocarte.recap.r0': 'Couleur = formation', 'geocarte.recap.r1': 'Courbes + contact = pendage', 'geocarte.recap.r2': 'Recoupe = plus jeune', 'geocarte.recap.c3': 'La réponse pour la mission.',
  'geocarte.hook.t0': 'La carte du trajet', 'geocarte.hook.t1': 'On zoome sur la zone', 'geocarte.hook.t2': 'Même lieu, autre carte',
  ...sc('hook', 'Même lieu, un autre regard',
    ['Voici la **carte topographique** de la mission : le camp A, le refuge B.', 'Zoomons sur **la zone du trajet**.', 'Même lieu : une **carte géologique**, plus des altitudes.'],
    'Laisser trente secondes : que pensent-ils que les couleurs signifient ? Ne pas corriger : le vote suit. Groupe peu à l’aise avec les courbes de niveau ? Commencer par la leçon préalable « Lire le relief » (7 min, #/stage/prereq).', 'À quoi servent ces couleurs, selon vous ?'),
  'geocarte.v1.top': 'Que représentent les couleurs ?',
  ...vt('v1', 'Que veulent dire ces couleurs ?', 'Que représentent les couleurs de la carte ?', ['Des formations rocheuses', 'L’altitude', 'La végétation', 'La profondeur'],
    'Chaque couleur = une formation rocheuse (roche + âge).', 'Les trois erreurs ont chacune une cause précise : les carte topographiques ont habitué l’œil à lire « couleur = hauteur ».', 'Qui a pensé à l’altitude ? Pourquoi ?'),
  'geocarte.legende.t1': 'Du plus récent (haut) au plus ancien (bas)', 'geocarte.legende.t2': 'Même couleur, 300 m d’écart', 'geocarte.legende.t3': 'Couleur = formation',
  ...sc('legende', 'La légende est une colonne du temps',
    ['La carte et sa **légende** : une pastille par formation.', 'La légende se lit **de haut en bas**, du plus récent au plus ancien.', 'Prenons **une seule** formation : elle apparaît à des altitudes très différentes.', 'La couleur dit **quelle roche**, jamais quelle hauteur.'],
    'Pointer les deux repères d’altitude : même couleur, plus de trois cents mètres d’écart.', 'Que devient la légende si on mélange l’ordre ?'),
  'geocarte.contact.t0': 'Chaque trait noir = un contact', 'geocarte.contact.t1': 'Un contact sépare deux formations',
  ...sc('contact', 'Un contact, c’est une limite',
    ['Chaque **trait noir** est un contact entre deux formations.', 'Un contact = la **trace** d’une surface de séparation sur le sol.'],
    'Le contact est une trace sur le sol, pas une couche.', 'Où est le contact entre deux couleurs voisines ?'),
  'geocarte.horiz.t0': 'Une série tabulaire', 'geocarte.horiz.t1': 'Contacts et courbes de niveau ?',
  ...sc('horiz', 'Que remarquez-vous ?',
    ['Cette carte-ci : cinq bandes, et des contacts très sinueux.', 'On ajoute les **courbes de niveau** (tous les 100 m).'],
    'Laisser regarder en silence 15 secondes avant de passer au vote : ils doivent voir que contacts et courbes se confondent.', 'Quels traits se ressemblent ?'),
  'geocarte.v2.top': 'Contact (rouge) = courbe 500 m',
  ...vt('v2', 'Que dit un contact sur une courbe ?', 'Le contact (rouge) suit exactement la courbe de niveau 500 m. Les couches sont…', ['Horizontales', 'Inclinées vers l’Est', 'Verticales', 'On ne peut rien dire'],
    'Altitude constante le long du contact ⇒ couche horizontale.', 'Ne pas dire la règle avant le vote : elle sort de la correction.', 'Et si le contact croise les courbes ?'),
  'geocarte.dip.t1': 'Un contact qui croise les courbes', 'geocarte.dip.t2': 'Trouver 446 m sur la ligne', 'geocarte.dip.t3': 'Ligne de direction', 'geocarte.dip.t4': 'Pendage vers {dir}', 'geocarte.dip.t5': 'tan(pendage) = Δz ÷ d',
  ...sc('dip', 'Direction et pendage en trois points',
    ['Un contact **croise** les courbes : la couche est inclinée. Comment mesurer l’inclinaison ?', 'Choisissons **trois points** du contact, avec leur altitude.', 'Sur le segment bas–haut, on **interpole** l’altitude du point du milieu.', 'Relier les deux points de même altitude : c’est la **ligne de direction**.', 'Perpendiculairement, vers l’altitude la plus basse : le **sens du pendage**.', '**Δz** et **d** : pendage = atan(Δz ÷ d).'],
    'Construire au tableau en même temps que l’écran, sur la carte imprimée. Laisser prédire chaque étape avant de cliquer.', 'Pourquoi trois points et pas deux ?'),
  'geocarte.v3.o3': 'Vers le bas du versant', 'geocarte.v3.top': 'La ligne rouge est à {z} m partout',
  ...vt('v3', 'Vers où plonge la couche ?', 'La couche plonge vers…', ['', '', '', ''],
    'Vers l’altitude la plus basse du contact, perpendiculairement à la direction.', 'Le piège C : la direction (même altitude) est perpendiculaire au pendage, pas parallèle.', 'Qui a confondu direction et pendage ?'),
  'geocarte.age.t0': 'Les bandes se suivent', 'geocarte.age.t1': 'On marche vers {dir}', 'geocarte.age.t2': 'De plus en plus récent', 'geocarte.age.t3': 'Série normale',
  ...sc('age', 'Le pendage donne le sens du temps',
    ['Les bandes se succèdent dans un ordre précis.', 'Marchons **dans le sens du pendage**, en traversant les bandes une à une.', 'Chaque nouvelle bande est **plus récente** que la précédente (la légende le confirme).', 'Série normale : dans le sens du pendage, c’est plus jeune.'],
    'Principe de superposition : on dépose sur ce qui existe. Mentionner les couches renversées sans s’y attarder.', 'Pourquoi le dessus est-il plus jeune ?'),
  'geocarte.v4.top': 'On marche vers {dir}, dans le sens du pendage',
  ...vt('v4', 'Qui est le plus jeune ?', 'En marchant dans le sens du pendage, on rencontre des formations…', ['De plus en plus récentes', 'De plus en plus anciennes', 'Toutes du même âge', 'Cela dépend du relief'],
    'Série normale : plus jeune dans le sens du pendage.', 'Sur série normale seulement.', 'Et si on marche contre le pendage ?'),
  'geocarte.recoup.t0': 'Un filon rouge', 'geocarte.recoup.t1': 'Il traverse les couches', 'geocarte.recoup.t2': 'Le filon est plus jeune',
  ...sc('recoup', 'Ce qui coupe est plus jeune',
    ['Un filon traverse la série.', 'Il **recoupe** les bandes : il n’existait pas quand elles se sont déposées.', 'Ce qui **coupe** est toujours plus jeune que ce qui est coupé.'],
    'Principe de recoupement. Granite et failles fonctionnent pareil.', 'Qu’est-ce qui était déjà là ?'),
  'geocarte.sig.tabulaire': 'Tabulaire : contacts = courbes', 'geocarte.sig.monoclinal': 'Monoclinal : bandes parallèles, en V', 'geocarte.sig.anticlinal': 'Anticlinal : le plus ancien au centre', 'geocarte.sig.synclinal': 'Synclinal : le plus récent au centre', 'geocarte.sig.discordance': 'Discordance : un contact coupe les autres', 'geocarte.sig.granite': 'Granite : forme libre qui recoupe',
  ...sc('struct', 'Six signatures à reconnaître',
    ['**Tabulaire** : couches horizontales, contacts parallèles aux courbes.', '**Monoclinal** : bandes parallèles, des V dans les vallées.', '**Anticlinal** : les couches les plus anciennes au centre, symétrie.', '**Synclinal** : les plus récentes au centre.', '**Discordance** : un contact en coupe d’autres : érosion puis dépôt.', '**Granite** : une masse qui recoupe les couches.'],
    'Prendre une structure par minute. Insister sur les paires opposées anticlinal / synclinal.', 'Comment reconnaît-on un pli sans voir la coupe ?'),
  'geocarte.v5.top': 'Quelle structure ?',
  ...vt('v5', 'Quel pli ?', 'Au centre, les roches sont les plus anciennes. La structure est un…', ['Anticlinal', 'Synclinal', 'Monoclinal', 'Discordance'],
    'Centre le plus ancien et symétrie ⇒ anticlinal.', 'Anticlinal : ancien au cœur. Synclinal : récent au cœur.', 'Comment le sait-on avec la légende ?'),
  'geocarte.pr.t0': 'Pendage et direction ?', 'geocarte.pr.t2': 'Pendage {dip}° vers {dir} (direction N{sz}°)',
  ...sc('pr', 'À vous : trouvez le pendage',
    ['Sur **votre** carte imprimée, ce contact passe par trois points cotés.', 'Construisez la ligne de direction, puis calculez le pendage. Le minuteur tourne.', 'Correction : direction, sens et valeur du pendage.'],
    'Circuler. Distribuer la carte imprimée de l’exercice. Ne montrer la solution qu’à la fin du temps.', 'Qui a mesuré d au lieu de Δz ?'),
  ...sc('recap', 'À retenir',
    ['**Couleur = formation**, jamais altitude ; la légende va du récent à l’ancien.', '**Un contact qui croise les courbes** donne direction et pendage (trois points).', 'Le **pendage** donne le sens du temps ; ce qui **recoupe** est plus jeune.', 'La réponse pour la mission.'], 'Passer à la leçon suivante : la coupe géologique.', 'Quelle règle vous a surpris ?'),
  'geocarte.recap.claim': 'À retenir',
  'mis.g-couleur-alt': 'Couleur = altitude', 'mis.g-couleur-alt.why': 'Une même formation couvre des altitudes très différentes : la couleur désigne une roche, pas une hauteur.',
  'mis.g-couleur-veg': 'Couleur = végétation', 'mis.g-couleur-veg.why': 'La carte géologique montre les roches, pas ce qui pousse dessus.',
  'mis.g-couleur-prof': 'Couleur = profondeur', 'mis.g-couleur-prof.why': 'La carte est vue de dessus : elle donne la nature et l’âge des roches affleurantes.',
  'mis.g-horiz-incl': 'Contact sur une courbe = incliné', 'mis.g-horiz-incl.why': 'Altitude constante le long du contact : la couche ne s’incline pas.',
  'mis.g-horiz-vert': 'Couche verticale', 'mis.g-horiz-vert.why': 'Un contact vertical serait une droite, indifférente aux courbes.',
  'mis.g-horiz-rien': 'On ne peut rien dire', 'mis.g-horiz-rien.why': 'Si : une altitude constante le long du contact suffit.',
  'mis.g-dipsens': 'Sens du pendage inversé', 'mis.g-dipsens.why': 'Le pendage va vers l’altitude la plus basse du contact.',
  'mis.g-dipstrike': 'Direction prise pour le pendage', 'mis.g-dipstrike.why': 'La ligne de direction (même altitude) est perpendiculaire au pendage.',
  'mis.g-dipterrain': 'Pendage = pente du terrain', 'mis.g-dipterrain.why': 'Le pendage est celui de la couche, déduit des contacts, pas celui du versant.',
  'mis.g-agesens': 'Âge inversé', 'mis.g-agesens.why': 'Dans une série normale, plus jeune dans le sens du pendage.',
  'mis.g-agememe': 'Même âge pour toutes les bandes', 'mis.g-agememe.why': 'Chaque bande est une formation distincte, déposée à son tour.',
  'mis.g-agerelief': 'L’âge dépend du relief', 'mis.g-agerelief.why': 'Le relief décale les contacts, pas l’ordre des âges.',
  'mis.g-pli-inv': 'Anticlinal ↔ synclinal', 'mis.g-pli-inv.why': 'Anticlinal : ancien au cœur. Synclinal : récent au cœur.',
  'mis.g-pli-mono': 'Monoclinal pris pour un pli', 'mis.g-pli-mono.why': 'Un monoclinal vieillit dans un seul sens, sans symétrie.',
  'mis.g-pli-disc': 'Discordance prise pour un pli', 'mis.g-pli-disc.why': 'Une discordance fait toucher des âges très différents, sans symétrie centrale.',
};
FR['geocarte.legende.t2'] = 'Même couleur, des altitudes très différentes';
FR['geocarte.dip.t2'] = 'Un point de même altitude que le point du milieu';
