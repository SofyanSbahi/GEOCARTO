/* WP3 (v3.1) — mauvaises réponses FIGURÉES : chaque distracteur d'un vote est la figure du malentendu, calculée par le moteur.
   Règle de lisibilité L6 : deux options ne se ressemblent jamais (écart ≥ 15° ou de signe ; coupes différentes sur ≥ 40 % des cellules) ;
   une option figurée ne porte aucun texte (la lettre est ajoutée par le vote) et aucun point focal. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { t } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import * as K from '../js/stage/kit.js';
import { lessonById } from '../js/stage/lessons/index.js';
import { missionGeo, demoGeo, galerie, midLine, foldGeos } from '../js/stage/lessons/geoworld.js';
import { miniSectionOf } from '../js/stage/lessons/geosection.js';
import {
  contactVariants, lineSeparation, lineDirection, downhillAzimuth, dipDirectionCandidates, angleSeparation, FOLD_VARIANTS, foldVariants, gridDifference, sectionGrid, boundaries, apparentDip
} from '../js/engine/geology/index.js';

const coupe = lessonById('coupe'), geo = lessonById('geocarte');
const vote = (L, id) => L.scenes.find(s => s.id === id).vote;
const mis = v => v.opts.map(o => o.ok ? 'ok' : o.mis);
const ROOMS = [.8, 1, 1.5, 2.5], ASPECTS = [16 / 9, 4 / 3, 5 / 4];

test('contactVariants : ordre canonique du vote, chaque mauvaise réponse = un malentendu nommé', () => {
  const v = contactVariants({ apparent: 31, sense: 1 });
  assert.deepEqual(v.map(x => x.id), mis(vote(coupe, 'v1')), 'l\'ordre des variantes doit être celui des options du vote');
  assert.equal(v[0].ok, true); assert.equal(v.filter(x => x.ok).length, 1);
  assert.deepEqual([v[0].angle, v[0].sense], [31, 1]);
  assert.deepEqual([v[1].angle, v[1].sense], [31, -1], 'sens inversé');
  assert.equal(v[2].angle, 90, 'contacts verticaux'); assert.equal(v[3].angle, 0, 'contacts à plat');
});

test('contactVariants : jamais deux options semblables (écart ≥ 15°) dès que le pendage apparent est entre 15° et 75°', () => {
  for (const sense of [1, -1]) for (let a = 15; a <= 75; a += 5) {
    const v = contactVariants({ apparent: a, sense });
    assert.ok(lineSeparation(v) >= 15 - 1e-9, `α′=${a}° sens ${sense} : écart ${lineSeparation(v).toFixed(1)}°`);
    assert.equal(Math.sign(lineDirection(v[0])), -Math.sign(lineDirection(v[1])), 'le sens inversé doit changer de signe');
  }
  assert.ok(lineSeparation(contactVariants({ apparent: 8, sense: 1 })) < 15, 'un pendage apparent de 8° ne ferait pas un bon vote : l\'écart tombe sous 15°');
});

test('mission : le pendage apparent du vote est celui du moteur, et les quatre figures sont distinctes', () => {
  const M = missionGeo(), exact = apparentDip(M.dip, M.dipAz, M.az);
  assert.ok(Math.abs(M.apparent - exact) < .5, `α′ vote ${M.apparent.toFixed(2)}° ≠ moteur ${exact.toFixed(2)}°`);
  const sense = Math.cos((M.dipAz - M.az) * Math.PI / 180) >= 0 ? 1 : -1;
  assert.ok(lineSeparation(contactVariants({ apparent: M.apparent, sense })) >= 15);
});

test('downhillAzimuth : azimut de la plus grande pente (plans connus)', () => {
  const dem = (f) => { const W = 40, H = 40, z = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) z[j * W + i] = f(i, j); return { W, H, z, cellM: 25, zmin: 0, zmax: 1e4 }; };
  const near = (a, b) => assert.ok(angleSeparation(a, b) < 1.5, `${a.toFixed(1)}° ≠ ${b}°`);
  near(downhillAzimuth(dem((i) => 5 * i), 20, 20), 270);      // monte vers l'Est → descend vers l'Ouest
  near(downhillAzimuth(dem((i) => -5 * i), 20, 20), 90);
  near(downhillAzimuth(dem((i, j) => 5 * j), 20, 20), 0);     // y vers le bas = Sud : monte vers le Sud → descend vers le Nord
  near(downhillAzimuth(dem((i, j) => -5 * j), 20, 20), 180);
});

test('dipDirectionCandidates : quatre flèches distinctes (≥ 25°), dans l\'ordre du vote, issues d\'un point lisible', () => {
  const M = demoGeo(), T = M.tp, d = M.geo.dem, cen = { x: (T.p[0].x + T.p[1].x + T.p[2].x) / 3, y: (T.p[0].y + T.p[1].y + T.p[2].y) / 3 };
  const r = dipDirectionCandidates({ dipAz: T.dipAz, strikeAz: T.strikeAz, dem: d, origins: [cen, T.p[1], T.Q] });
  assert.deepEqual(r.candidates.map(c => c.id), mis(vote(geo, 'v3')), 'l\'ordre des flèches doit être celui des options du vote');
  assert.ok(r.ok && r.minSep >= 25, `écart minimal ${r.minSep.toFixed(0)}°`);
  assert.equal(r.origin, cen, 'le centre du triangle (le plus lisible) doit être préféré quand il convient');
  const az = r.candidates.map(c => c.az);
  assert.ok(angleSeparation(az[0], T.dipAz) < 1e-6 && angleSeparation(az[1], T.dipAz + 180) < 1e-6 && angleSeparation(az[2], T.strikeAz) < 1e-6);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(angleSeparation(az[i], az[j]) >= 25, `flèches ${i} et ${j} trop proches`);
});

test('dipDirectionCandidates : si aucun point ne convient, on retient le meilleur et on le signale', () => {
  const W = 40, H = 40, z = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) z[j * W + i] = -5 * j;   // descend vers le Sud (180°)
  const r = dipDirectionCandidates({ dipAz: 180, strikeAz: 90, dem: { W, H, z, cellM: 25 }, origins: [{ x: 20, y: 20 }] });
  assert.equal(r.ok, false); assert.ok(r.minSep < 25);      // la pente du terrain se confond avec le pendage : le vote serait ambigu
});

test('foldVariants : mêmes ids et même ordre que les options du vote ; coupes très différentes sur le MÊME terrain', () => {
  assert.deepEqual(FOLD_VARIANTS.map(v => v.id), mis(vote(coupe, 'v3')));
  const G = galerie('anticlinal'), l = midLine(G), dem = G.geo.dem, vs = foldVariants(dem, 2).map(v => ({ ...v, sec: sectionGrid(v.geo, l.A, l.B, 160, 85) }));
  assert.deepEqual(vs.map(v => v.kind), ['anticlinal', 'synclinal', 'monoclinal', 'tabulaire']);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(gridDifference(vs[i].sec, vs[j].sec) >= .4, `${vs[i].kind} / ${vs[j].kind} : seulement ${(100 * gridDifference(vs[i].sec, vs[j].sec)).toFixed(0)} % de cellules différentes`);
  assert.equal(gridDifference(vs[0].sec, sectionGrid(G.geo, l.A, l.B, 160, 85)), 0, 'la bonne réponse doit être la coupe exacte de la carte de la galerie');
  const ids = new Set(vs.map(v => v.geo.dem)); assert.equal(ids.size, 1, 'les quatre structures doivent partager le même terrain');
});

/* pendage apparent (degrés) du plus long contact de la coupe : régression de z sur s */
const contactAngle = (sec, geo) => {
  let best = null; for (const [k, pts] of boundaries(sec, geo)) if (k !== 'F' && (!best || pts.length > best.length)) best = pts;
  const n = best.length, mx = best.reduce((a, p) => a + p[0], 0) / n, mz = best.reduce((a, p) => a + p[1], 0) / n;
  const sxx = best.reduce((a, p) => a + (p[0] - mx) ** 2, 0), sxz = best.reduce((a, p) => a + (p[0] - mx) * (p[1] - mz), 0);
  return Math.abs(Math.atan(sxz / sxx) * 180 / Math.PI);
};
test('foldVariants : le monoclinal plonge DANS le plan de la coupe (bandes inclinées), le tabulaire est plat — sur la coupe réellement montrée', () => {
  const by = Object.fromEntries(foldGeos().map(v => [v.kind, v.ctx])), angle = kind => { const G = by[kind], l = midLine(G), S = miniSectionOf(G, l.A, l.B); return { a: contactAngle(S.sec, G.geo), units: new Set(S.sec.g.filter(x => x >= 0)).size }; };
  const mono = angle('monoclinal'), tab = angle('tabulaire');
  assert.ok(mono.a >= 15 && mono.a <= 45, `monoclinal : pendage apparent ${mono.a.toFixed(1)}° (attendu 15–45°) — sinon la coupe suit la direction des couches et montre des bandes plates`);
  assert.ok(tab.a < 3, `tabulaire : contacts à ${tab.a.toFixed(1)}° (attendu : plats)`);
  assert.ok(tab.units >= 3, `tabulaire : ${tab.units} formation(s) visible(s) seulement — les limites doivent être réparties sur toute la profondeur montrée`);
});

test('gridDifference : refuse deux grilles de tailles différentes', () => {
  assert.throws(() => gridDifference({ g: new Int16Array(4) }, { g: new Int16Array(5) }));
  assert.equal(gridDifference({ g: Int16Array.from([1, 1, -1]) }, { g: Int16Array.from([1, 2, 3]) }), .5);
});

test('votes « galerie » : mise en page déclarée, chaque option figurée sans texte ni point focal, à toutes les tailles', () => {
  for (const [L, id] of [[coupe, 'v1'], [coupe, 'v3']]) {
    const v = vote(L, id); assert.equal(v.layout, 'gallery'); assert.equal(typeof v.optFig, 'function');
    for (const rs of ROOMS) for (const asp of ASPECTS) { K.room(rs, asp);
      v.opts.forEach((o, c) => { const svg = v.optFig(c, { x: 61, y: 9.6, w: 46, h: 21.5 }, { t });
        assert.ok(svg.length > 200, `${id}.${c} : figure vide`); assert.ok(!/<text/.test(svg), `${id}.${c} : une option figurée ne porte aucun texte`); assert.ok(!/\bfp\b/.test(svg), `${id}.${c} : point focal dans une option`); }); }
  }
  K.room(1, 16 / 9);
});

test('les figures des options sont toutes différentes les unes des autres (même cadre)', () => {
  K.room(1, 16 / 9);
  for (const id of ['v1', 'v3']) { const v = vote(coupe, id), figs = v.opts.map((o, c) => v.optFig(c, { x: 61, y: 9.6, w: 46, h: 21.5 }, { t })); assert.equal(new Set(figs).size, 4, `${id} : deux options identiques`); }
});

test('flèches lettrées de « Vers où plonge la couche ? » : lettres suivies selon l\'ordre mélangé, toutes dans la carte', () => {
  const v = vote(geo, 'v3'); K.room(1, 16 / 9);
  for (const perm of [[0, 1, 2, 3], [2, 0, 3, 1], [3, 2, 1, 0]]) {
    const inv = []; perm.forEach((c, d) => { inv[c] = d; });
    const svg = v.draw(0, { t, nf: n => String(Math.round(n)), letterOf: c => 'ABCD'[inv[c]] });
    const badges = [...svg.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="3.2"[^>]*\/?><\/circle>\s*<text[^>]*>([A-D])<\/text>/g)];
    assert.equal(badges.length, 4, 'quatre flèches lettrées attendues'); assert.deepEqual(badges.map(b => b[3]).sort(), ['A', 'B', 'C', 'D']);
    assert.deepEqual(badges.map(b => b[3]), [0, 1, 2, 3].map(c => 'ABCD'[inv[c]]), 'la lettre doit suivre l\'option canonique');
    for (const b of badges) { assert.ok(+b[1] >= 7 && +b[1] <= 81 && +b[2] >= 17 && +b[2] <= 66, `lettre ${b[3]} hors de la carte (${b[1]}, ${b[2]})`); }
  }
});
