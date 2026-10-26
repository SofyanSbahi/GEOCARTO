/* Thème 9 — PROFIL TOPOGRAPHIQUE (leçon prioritaire). 9 scènes ≈ 24 min.
   Idée centrale : un profil se CONSTRUIT (croisements → points → courbe), il ne se « dessine » pas.
   Tout vient du moteur : pickLine, crossings, paperChoices/paperAdvice, curveFn, evaluateProfile/detectErrors — le même que l’espace élève. */
import * as K from '../kit.js';
import { recapFig } from './mission.js';
import { mapSvg, toMap } from './maps.js';
import { makeDem, niceEq } from '../../engine/terrain/index.js';
import { pickLine, paperChoices, makeSetup, paperGeometry, paperAdvice, curveFn, evaluateProfile, detectErrors, MAX_SHEET_CM } from '../../engine/profile/index.js';
import { rng } from '../../engine/math.js';
const { C, txt, line, rect, circ, path, poly, g, arrow, at, badge, tag, lo, el } = K;

/* ---------- données de la leçon (déterministes : même graine ⇒ même terrain, même trait) ---------- */
export function setup(seed) {
  const types = ['vallee', 'complexe', 'montagne'];
  for (let k = 0; k < 60; k++) {
    const sd = seed + k, type = types[(seed + k) % 3], d = makeDem({ type, seed: sd, scaleN: 25000 }), eq = niceEq(d.zmax - d.zmin), ln = pickLine(d, eq, rng(sd * 13 + 5));
    if (!ln) continue;
    const ch = paperChoices({ dem: d, A: ln.A, B: ln.B, eq }), hs = d.scaleN / 100, L = ln.P.at(-1).s, cross = ln.cross;
    const mk = ev => makeSetup({ dem: d, A: ln.A, B: ln.B, eq, vm: hs / ev, z0: ch.z0 });
    /* doublons : deux croisements consécutifs de même altitude ⇒ un extremum entre eux (sommet si les voisins sont plus bas) */
    const dups = []; cross.forEach((c, i) => { if (i && c.z === cross[i - 1].z) { const before = i > 1 ? cross[i - 2].z : null, after = i < cross.length - 1 ? cross[i + 1].z : null; const max = (before != null ? before < c.z : after != null ? after < c.z : true); dups.push({ i: i - 1, j: i, z: c.z, s: (cross[i - 1].s + c.s) / 2, max, est: c.z + (max ? 1 : -1) * eq / 2 }); } });
    const ev0 = Math.round(hs / ch.vm * 10) / 10, setupRec = mk(ev0 || 5), g0 = paperGeometry(setupRec);
    /* la « faute » du camarade (scène de diagnostic) est vérifiée par le moteur lui-même */
    /* séquence de report : A (altitude lue par interpolation), croisements, B */
    const r5 = z => Math.round(z / 5) * 5, seq = [{ s: 0, z: r5(ln.P[0].z), end: 'A' }, ...cross.map(c => ({ s: c.s, z: c.z })), { s: L, z: r5(ln.P.at(-1).z), end: 'B' }];
    const pts = seq.map(c => ({ s: c.s, z: c.z })), marks = cross.map((c, i) => ({ i, t: c.t, s: c.s, z: c.z, zs: c.z }));
    const R = evaluateProfile(setupRec, { pts, smooth: false, marks, cross, hints: 0 }), errs = R ? detectErrors(setupRec, R, { pts, smooth: false, marks }) : [];
    return { d, eq, type, sd, A: ln.A, B: ln.B, P: ln.P, cross, seq, L, hs, ch, ev0: ev0 || 5, z0: ch.z0, zTop: g0.zTop, mk, dups, errs, code: `${type}-${sd.toString(36)}-25`, pts };
  }
  throw new Error('profil: aucun trait de coupe trouvé');
}
const MAP_BIG = { x: 2, y: .5, w: 100, h: 68.9 }, MAP_MID = { x: 2, y: 5, w: 88, h: 60.5 };
const dist = (m, nf) => m >= 1000 ? `${nf(m / 1000, 2)} km` : `${nf(m)} m`;

/* cadre du profil (bande de report en haut, papier dessous) */
const frame = c => { const x0 = 17, x1 = 154, y0 = 22, y1 = 61; return { x0, x1, y0, y1, X: s => x0 + s / c.L * (x1 - x0), Y: z => y1 - (z - c.z0) / (c.zTop - c.z0) * (y1 - y0) }; };
function axes(c, F, X) {
  let o = rect(F.x0, F.y0 - 1, F.x1 - F.x0, F.y1 - F.y0 + 1, { fill: '#fff', stroke: C.ink, w: .6 });
  const n = Math.round((c.zTop - c.z0) / c.eq), every = n > 9 ? 2 : 1;
  for (let k = 0; k <= n; k++) { const z = c.z0 + k * c.eq; o += line(F.x0, F.Y(z), F.x1, F.Y(z), { c: C.line, w: k ? .3 : .6 }); if (k % every === 0) o += txt(F.x0 - 1.2, F.Y(z), String(z), { size: 3.4, anchor: 'end', w: 700, fill: C.mute }); }
  o += badge(F.x0, F.y1 + 4.4, 'A', { r: 2.5, size: 3.6, quiet: true }) + badge(F.x1, F.y1 + 4.4, 'B', { r: 2.5, size: 3.6, quiet: true }) + txt((F.x0 + F.x1) / 2, F.y1 + 4.6, X.t('profil.dist', { d: dist(c.L, X.nf) }), { size: 3.8, w: 700, fill: C.mute });
  return o;
}
/* bande « carte dépliée » : le trait AB à plat, avec les croisements et leurs altitudes */
function strip(c, F, upTo) {
  let o = line(F.x0, 11, F.x1, 11, { c: C.ink, w: .9 }) + badge(F.x0 - 5, 11, 'A', { r: 2.5, size: 3.6, quiet: true }) + badge(F.x1 + 3, 11, 'B', { r: 2.5, size: 3.6, quiet: true });
  c.cross.forEach((p, i) => {
    if (i >= upTo) return; const x = F.X(p.s), prev = i ? F.X(c.cross[i - 1].s) : -99, up = (x - prev) >= 8.5 || i % 2 === 0;
    o += line(x, 8.8, x, 13.2, { c: C.brown, w: .8 }) + txt(x, up ? 5.2 : 17.4, String(p.z), { size: 3.4, w: 800, fill: '#4a2208' });
  });
  return o;
}
const polyline = (pts, F, o) => path('M' + pts.map(p => `${F.X(p.s).toFixed(1)} ${F.Y(p.z).toFixed(1)}`).join('L'), o);
const smoothPath = (pts, F, c, o) => { const f = curveFn([...pts].sort((a, b) => a.s - b.s), true), N = 140, a = []; for (let k = 0; k <= N; k++) { const s = c.L * k / N; a.push(`${F.X(s).toFixed(1)} ${F.Y(f(s)).toFixed(1)}`); } return path('M' + a.join('L'), o); };
const solid = (o, st, k, inner) => at(st, k, inner);

export const profil = {
  id: 'profil', title: 'topic.9', seed: 4, setup,
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        const c = X.ctx, mp = toMap(MAP_BIG, c.d), a = mp(c.A), b = mp(c.B);
        let o = mapSvg(c.d, c.eq, MAP_BIG);
        o += at(st, 1, line(a[0], a[1], b[0], b[1], { c: C.acc, w: 1.1 }) + badge(a[0], a[1], 'A', { r: 2.8, fill: C.acc }) + badge(b[0], b[1], 'B', { r: 2.8, fill: C.acc }));
        o += at(st, 2, [[X.t('profil.chip.eq', { e: c.eq }), 14], [X.t('profil.chip.len', { d: dist(c.L, X.nf) }), 28], [X.t('profil.chip.code'), 44], [c.code, 44 + 5.8 * K.fsz() + .8]].map(([s, y], i) => i === 3 ? tag(133, y, s, { size: 4.6, fill: C.ink }) : txt(133, y, s, { size: i === 2 ? 3.8 : 5, w: 800, fill: i === 2 ? C.mute : C.ink })).join(''));
        return o;
      } },
    { id: 'survey', kind: 'show', steps: 3, min: 3,
      fig: (st, p, X) => {
        const c = X.ctx, mp = toMap(MAP_MID, c.d), a = mp(c.A), b = mp(c.B);
        let o = mapSvg(c.d, c.eq, MAP_MID, { labels: false }) + line(a[0], a[1], b[0], b[1], { c: C.acc, w: 1 }) + badge(a[0], a[1], 'A', { r: 2.6, fill: C.acc }) + badge(b[0], b[1], 'B', { r: 2.6, fill: C.acc });
        o += at(st, 1, c.cross.map(q => { const m = mp(q); return circ(m[0], m[1], 1.1, { fill: C.gold, stroke: C.ink, w: .35 }); }).join(''));
        const per = Math.ceil(c.cross.length / 2);
        o += at(st, 2, c.cross.map((q, i) => { const col = i < per ? 0 : 1, row = i % per, x = 96 + col * 33, y = 8 + row * 5.1, dup = (c.dups.some(d => d.i === i || d.j === i));
          return (dup ? rect(x - 1, y - 2.5, 30, 5, { fill: '#ffe9a6', rx: 1 }) : '') + txt(x, y, `${i + 1}.`, { size: 3.4, anchor: 'start', w: 600, fill: C.mute }) + txt(x + 7, y, `${q.z} m`, { size: 3.8, anchor: 'start', w: 800 }); }).join(''));
        o += at(st, 2, c.dups.length ? tag(127, 63, X.t('profil.dupTag'), { size: 3.8, fill: '#8a6a00' }) : '');
        return o;
      } },
    { id: 'paper', kind: 'build', steps: 3, min: 3, capVars: (st, ev) => ({ e: ev }), param: { values: [1, 2, 5, 10], start: 2, label: (v, i, X) => X.t('profil.ev', { e: v }) },
      fig: (st, ev, X) => {
        const c = X.ctx, S = c.mk(ev), gm = S.geometry(), big = c.mk(10).geometry(), k = Math.min(78 / big.Wmm, 64 / big.Hmm), adv = paperAdvice(S);
        const ox = 8 + (86 - gm.Wmm * k) / 2, oy = 3 + (64 - gm.Hmm * k);   // la feuille « pousse » vers le haut quand Ev grandit
        let o = rect(ox, oy, gm.Wmm * k, gm.Hmm * k, { fill: '#fff', stroke: adv.ok ? C.ink : C.red, w: .8 });
        const base = S.toMm(0, c.z0, gm);
        o += line(ox + base.x * k, oy + base.y * k, ox + (gm.Wmm - 15) * k, oy + base.y * k, { c: C.ink, w: .7 }) + line(ox + base.x * k, oy + 10 * k, ox + base.x * k, oy + base.y * k, { c: C.ink, w: .7 });
        o += at(st, 1, path('M' + gm.P.map(q => { const m = S.toMm(q.s, q.z, gm); return `${(ox + m.x * k).toFixed(1)} ${(oy + m.y * k).toFixed(1)}`; }).join('L'), { stroke: C.acc, w: .9 }));
        const R = 100;
        o += rect(R, 4, 56, 62, { fill: C.soft, rx: 2 }) + txt(R + 28, 10, X.t('profil.hz'), { size: 3.8, w: 700, fill: C.mute }) + txt(R + 28, 17, `1 cm = ${X.nf(c.hs)} m`, { size: 5.4, w: 800 });
        o += at(st, 1, txt(R + 28, 26, X.t('profil.vt'), { size: 3.8, w: 700, fill: C.mute }) + txt(R + 28, 35, `Ev × ${ev}`, { size: 7.6, w: 800, fill: C.acc }) + txt(R + 28, 44, X.t('profil.hcm', { h: X.nf(adv.profileCm, 1) }), { size: 4.4, w: 700 }));
        o += at(st, 2, tag(R + 28, 56, X.t('profil.adv.' + adv.reason, { max: MAX_SHEET_CM }), { size: 4.4, fill: adv.ok ? C.green : C.red }));
        return o;
      } },
    { id: 'v1', kind: 'vote', min: 2,
      vote: { opts: [{ mis: 'p-extrema' }, { ok: true }, { mis: 'p-extrema2' }, { mis: 'p-nsp' }],
        qText: X => { const d = X.ctx.dups[0]; return d ? X.t(d.max ? 'profil.v1.qmax' : 'profil.v1.qmin', { z: d.z }) : X.t('profil.v1.qmax', { z: X.ctx.cross[0].z }); },
        label: (i, X) => { const c = X.ctx, d = c.dups[0] || { z: c.cross[0].z, max: true }, hi = d.max ? d.z + c.eq : d.z - c.eq, a = Math.min(d.z, hi), b = Math.max(d.z, hi); return [X.t('profil.v1.o0', { z: d.z }), X.t('profil.v1.o1', { a, b }), X.t('profil.v1.o2', { z: hi }), X.t('profil.v1.o3')][i]; },
        solText: X => { const c = X.ctx, d = c.dups[0] || { z: c.cross[0].z, max: true }; return X.t('profil.v1.sol', { a: Math.min(d.z, d.z + (d.max ? 1 : -1) * c.eq), b: Math.max(d.z, d.z + (d.max ? 1 : -1) * c.eq), e: d.est ?? d.z + c.eq / 2 }); },
        draw: (st, X) => {
          const c = X.ctx, d = c.dups[0] || { z: c.cross[0].z, max: true }, fl = d.max ? 1 : -1, yz = 44, yh = yz - fl * 20, hi = d.max ? d.z + c.eq : d.z - c.eq;
          let o = line(6, yz, 84, yz, { c: C.ink, w: .5, dash: '2 1.4' }) + line(6, yh, 84, yh, { c: C.line, w: .5, dash: '2 1.4' }) + txt(5, yz + fl * 4.4, String(d.z), { size: 4, anchor: 'start', w: 800 }) + txt(5, yh - fl * 4, String(hi), { size: 4, anchor: 'start', w: 800, fill: C.mute });
          o += path(`M10 ${yz + fl * 14}C24 ${yz + fl * 8} 22 ${yz} 28 ${yz}C36 ${yz - fl * 14} 52 ${yz - fl * 14} 58 ${yz}C64 ${yz} 66 ${yz + fl * 8} 82 ${yz + fl * 14}`, { stroke: C.acc, w: 1 }) + circ(28, yz, 1.8, { fill: C.gold, stroke: C.ink, w: .4 }) + circ(58, yz, 1.8, { fill: C.gold, stroke: C.ink, w: .4 });
          return o + tag(43, yz - fl * 17.5, '?', { size: 6, fill: C.ink }) + txt(43, 64, X.t('profil.v1.top'), { size: 3.8, w: 700, fill: C.mute });
        } } },
    { id: 'construct', kind: 'build', min: 6, steps: ctx => ctx.seq.length + 3,
      cap: (st, p, X) => { const c = X.ctx, n = c.seq.length; if (st === 0) return ['profil.construct.c0']; if (st <= n) { const q = c.seq[st - 1]; return q.end ? ['profil.construct.end', { e: q.end, z: q.z }] : ['profil.construct.pt', { i: st - 1, n: n - 2, z: q.z, s: X.nf(Math.round(q.s)) }]; } return st === n + 1 ? ['profil.construct.curve'] : ['profil.construct.ext']; },
      fig: (st, p, X) => {
        const c = X.ctx, F = frame(c), n = c.seq.length, shown = Math.min(st, n), pts = c.seq.slice(0, shown).map(q => ({ s: q.s, z: q.z }));
        let o = axes(c, F, X) + strip(c, F, c.cross.length);
        pts.forEach((q, i) => { const x = F.X(q.s), y = F.Y(q.z), cur = i === st - 1 && st <= n, end = c.seq[i].end; o += line(x, end ? 17 : 13.5, x, y, { c: C.gold, w: cur ? .9 : .45, dash: '1.2 1.2' }) + circ(x, y, cur ? 1.9 : 1.3, { fill: cur ? C.acc : C.ink }); if (cur) o += tag(x + (end === 'A' ? 6 : end === 'B' ? -6 : 0), y - 4.6, (end ? '≈ ' : '') + q.z, { size: 3.8, fill: C.acc }); });
        const ext = c.dups.map(d => ({ s: d.s, z: d.est }));
        if (st >= n + 1) o += st === n + 1 ? K.el('g', { class: 'st-r enter' }, smoothPath(pts, F, c, { stroke: C.acc, w: .9, draw: true, cls: 'st-draw' })) : smoothPath(pts, F, c, { stroke: C.mute, w: .6, dash: '1.6 1.4' });
        if (st >= n + 2) { const all = [...pts, ...ext]; o += at(st, n + 2, ext.map(e => circ(F.X(e.s), F.Y(e.z), 1.8, { fill: C.green }) + tag(F.X(e.s), F.Y(e.z) + (e.z > c.cross.find(q => Math.abs(q.s - e.s) < 1e-9 || true).z ? -5 : 5), '≈ ' + X.nf(e.z), { size: 3.8, fill: C.green })).join('') + smoothPath(all, F, c, { stroke: C.green, w: 1, draw: true, cls: 'st-draw' })); }
        return o;
      } },
    { id: 'diag', kind: 'vote', min: 3,
      vote: { opts: [{ ok: true, mis: 'p-regle' }, { mis: 'p-origine' }, { mis: 'p-echelleH' }, { mis: 'p-points' }],
        draw: (st, X) => { const c = X.ctx, F = { ...frame(c), x0: 8, x1: 84, y0: 12, y1: 56 }; F.X = s => F.x0 + s / c.L * (F.x1 - F.x0); F.Y = z => F.y1 - (z - c.z0) / (c.zTop - c.z0) * (F.y1 - F.y0);
          const pts = c.seq.map(q => ({ s: q.s, z: q.z }));
          return rect(F.x0, F.y0 - 1, F.x1 - F.x0, F.y1 - F.y0 + 1, { fill: '#fff', stroke: C.ink, w: .6 }) + polyline(pts, F, { stroke: C.red, w: .9 }) + pts.map(q => circ(F.X(q.s), F.Y(q.z), 1, { fill: C.ink })).join('') + txt(46, 6.5, X.t('profil.diag.top'), { size: 4.6, w: 800 }) + txt(46, 62, X.t('profil.diag.bot'), { size: 3.8, w: 700, fill: C.mute }); } },
      q: 1 },
    { id: 'pr', kind: 'practice', min: 4, practice: { seconds: 240, draw: true },
      fig: (st, p, X) => {
        const c = X.ctx;
        if (st < 2) { const mp = toMap(MAP_BIG, c.d), a = mp(c.A), b = mp(c.B);
          return mapSvg(c.d, c.eq, MAP_BIG) + line(a[0], a[1], b[0], b[1], { c: C.acc, w: 1.1 }) + badge(a[0], a[1], 'A', { r: 2.8, fill: C.acc }) + badge(b[0], b[1], 'B', { r: 2.8, fill: C.acc }) +
            txt(133, 12, X.t('profil.chip.code'), { size: 3.8, w: 800, fill: C.mute }) + tag(133, 12 + 5.8 * K.fsz() + .8, c.code, { size: 4.6, fill: C.ink })   /* sous son intitulé, à toute échelle */ + txt(133, 33, X.t('profil.pr.hz'), { size: 4.2, w: 800 }) + txt(133, 40, `1 cm = ${X.nf(c.hs)} m`, { size: 4.6, w: 800 }) + txt(133, 49, X.t('profil.pr.vt'), { size: 4.2, w: 800 }) + txt(133, 56, `Ev × ${c.ev0}`, { size: 4.8, w: 800, fill: C.acc }); }
        const F = frame(c), n = c.cross.length, zi = c.seq.reduce((m, q) => q.z > m.z ? q : m, c.seq[0]), pts = c.seq.map(q => ({ s: q.s, z: q.z })), all = [...pts, ...c.dups.map(d => ({ s: d.s, z: d.est }))];
        return axes(c, F, X) + strip(c, F, n) + pts.map(q => circ(F.X(q.s), F.Y(q.z), 1.3, { fill: C.ink })).join('') + c.dups.map(d => circ(F.X(d.s), F.Y(d.est), 1.6, { fill: C.green })).join('') + K.el('g', { class: 'st-r enter' }, smoothPath(all, F, c, { stroke: C.green, w: 1.1, draw: true, cls: 'st-draw' })) +
          path('M' + c.P.filter((_, i) => i % 3 === 0).map(q => `${F.X(q.s).toFixed(1)} ${F.Y(q.z).toFixed(1)}`).join('L'), { stroke: C.mute, w: .45, dash: '1.2 1.4' }) + tag(zi.s < c.L / 2 ? 118 : 52, 26.5, X.t('profil.pr.truth'), { size: 3.8, fill: C.mute });
      } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1,
      fig: (st, p, X) => recapFig('profil', st, X) }
  ]
};
export const FR = {
  'topic.9': 'Profil topographique', 'topic.9.d': 'Construire une coupe : croisements, points, courbe',
  'profil.dist': 'A → B : {d}', 'profil.chip.eq': 'Éq. {e} m', 'profil.chip.len': 'A → B : {d}', 'profil.chip.code': 'Code du terrain', 'profil.dupTag': 'Doublon = sommet ou fond',
  'profil.hz': 'Échelle horizontale', 'profil.vt': 'Échelle verticale', 'profil.ev': 'Exagération ×{e}', 'profil.hcm': 'Profil : {h} cm de haut',
  'profil.adv.ok': 'Bon choix', 'profil.adv.tooSmall': 'Trop aplati', 'profil.adv.tooTall': 'Feuille > {max} cm', 'profil.adv.originAbove': 'Origine trop haute', 'profil.adv.originLow': 'Origine trop basse',
  'profil.v1.top': 'Sommet entre les deux points', 'profil.v1.qmax': 'Deux croisements consécutifs à {z} m. Où est le sommet entre eux ?', 'profil.v1.qmin': 'Deux croisements consécutifs à {z} m. Où est le fond entre eux ?',
  'profil.v1.o0': 'Exactement à {z} m', 'profil.v1.o1': 'Entre {a} et {b} m', 'profil.v1.o2': 'À {z} m (courbe suivante)', 'profil.v1.o3': 'Impossible à estimer',
  'profil.v1.sol': 'Entre {a} et {b} m : on estime ≈ {e} m (Éq ÷ 2).',
  'profil.diag.top': 'Le profil d’un camarade', 'profil.diag.bot': 'Même points que la bonne réponse', 'profil.pr.hz': 'Horizontal', 'profil.pr.vt': 'Vertical', 'profil.pr.truth': 'pointillé : profil exact',
  'profil.recap.r0': 'Croisements → points reportés', 'profil.recap.r1': 'Courbe lisse, pas règle', 'profil.recap.r2': 'Extremum : ≈ Éq ÷ 2 au-dessus',
  'profil.hook.claim': 'Couper le terrain suivant AB',
  'profil.hook.c0': 'Voici une carte à courbes de niveau.',
  'profil.hook.c1': 'On veut le **relief le long de A → B**.',
  'profil.hook.c2': 'Le **code** redonne exactement ce terrain sur chaque poste.',
  'profil.hook.note': 'Les étudiants peuvent ouvrir ce code dans l’espace élève (Simulateur de profil) pour s’entraîner sur le même terrain.', 'profil.hook.ask': 'Que verrait-on en marchant de A vers B ?',
  'profil.survey.claim': 'Relever les croisements',
  'profil.survey.c0': 'Le trait **A → B** traverse des courbes de niveau.',
  'profil.survey.c1': 'Chaque croisement est un **point à reporter**.',
  'profil.survey.c2': 'Deux altitudes identiques à la suite : un **sommet ou un fond** entre elles.',
  'profil.survey.note': 'Lire la liste dans l’ordre, de A vers B. Faire repérer les doublons.', 'profil.survey.ask': 'Pourquoi deux points à la même altitude ?',
  'profil.paper.claim': 'Choisir les échelles du papier',
  'profil.paper.c0': 'Horizontal : 1 cm sur le papier = distance fixée par la carte.',
  'profil.paper.c1': 'Vertical : l’**exagération** ×{e} agrandit le relief. Changez avec ↑ ↓.',
  'profil.paper.c2': 'Bon profil : de **5 cm** à la hauteur de la feuille.',
  'profil.paper.note': 'Montrer 1× (trop plat), 5× (bon), 10× (feuille trop haute).', 'profil.paper.ask': 'Pourquoi exagérer la verticale ?',
  'profil.v1.claim': 'Où est le sommet ?', 'profil.v1.c0': 'Pensez à la courbe suivante.', 'profil.v1.c1': 'Votez : A, B, C ou D.',
  'profil.v1.note': 'Cas typique : l’étudiant s’arrête à la dernière courbe croisée.', 'profil.v1.ask': 'Quelle estimation donnez-vous, et pourquoi ?',
  'profil.construct.claim': 'Construisons le profil',
  'profil.construct.c0': 'Papier prêt : la bande du haut est la carte « dépliée ».',
  'profil.construct.pt': 'Croisement **{i} / {n}** : à {s} m de A, altitude **{z} m**.',
  'profil.construct.end': 'Extrémité **{e}** : altitude lue entre les courbes, ≈ **{z} m**.',
  'profil.construct.curve': 'On relie à main levée : **une courbe**, pas une règle.',
  'profil.construct.ext': 'Les sommets sont **aplatis** : on ajoute les extrema estimés ≈ Éq ÷ 2.',
  'profil.construct.note': '→ pour chaque point : lire la bande, descendre à la bonne altitude. Faire annoncer l’altitude avant chaque point.', 'profil.construct.ask': 'Où placera-t-on le prochain point ?',
  'profil.diag.claim': 'Quelle est l’erreur ?', 'profil.diag.q': 'Quelle est l’erreur de ce profil ?',
  'profil.diag.c0': 'Les points sont justes.', 'profil.diag.c1': 'Votez : A, B, C ou D.',
  'profil.diag.o0': 'Reliés à la règle', 'profil.diag.o1': 'Origine décalée', 'profil.diag.o2': 'Longueur AB fausse', 'profil.diag.o3': 'Trop peu de points',
  'profil.diag.sol': 'Reliés par des segments : il faut une courbe.', 'profil.diag.note': 'Diagnostic confirmé par le moteur d’évaluation (le même que l’espace élève).', 'profil.diag.ask': 'Que voit-on sur un vrai sommet ?',
  'profil.pr.claim': 'À vous de tracer', 'profil.pr.c0': 'Reportez les points sur **votre** feuille. Terrain : code ci-contre.', 'profil.pr.c1': 'Tracez le profil A → B : le minuteur tourne.', 'profil.pr.c2': 'Le profil exact (pointillé) et le vôtre ?',
  'profil.pr.note': 'Circuler. Ne montrer la solution qu’à la fin du temps.', 'profil.pr.ask': 'Qui a oublié les extrema ?',
  'profil.recap.claim': 'À retenir', 'profil.recap.c0': 'Trois idées.', 'profil.recap.note': 'Faire reformuler. Renvoyer vers le Simulateur de profil avec le code du terrain.', 'profil.recap.ask': 'Quelle erreur éviterez-vous ?',
  'mis.p-regle': 'Profil relié à la règle', 'mis.p-regle.why': 'Le relief est continu : tracer une courbe lisse, pas des segments.',
  'mis.p-origine': 'Origine verticale décalée', 'mis.p-origine.why': 'Tous les points seraient décalés du même écart.',
  'mis.p-echelleH': 'Échelle horizontale fausse', 'mis.p-echelleH.why': 'La longueur du profil doit être celle de AB à l’échelle.',
  'mis.p-points': 'Points oubliés', 'mis.p-points.why': 'Il faut reporter TOUS les croisements.',
  'mis.p-extrema': 'Extremum placé sur la courbe', 'mis.p-extrema.why': 'Le sommet dépasse la dernière courbe : ≈ Éq ÷ 2 au-dessus.',
  'mis.p-extrema2': 'Extremum placé sur la courbe suivante', 'mis.p-extrema2.why': 'Sinon la courbe suivante aurait été croisée.',
  'mis.p-nsp': 'Renonce à estimer', 'mis.p-nsp.why': 'On ne connaît pas la valeur exacte, mais on sait l’encadrer.'
};
