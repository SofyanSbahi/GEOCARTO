/* Géologie (cartes + coupes) et outils d'enseignement : cohérence moteur ↔ leçons, protocole de vote, bibliothèque des malentendus. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { has, t } from '../js/stage/i18n.js';
import '../js/stage/lessons/fr.js';
import { mazur } from '../js/stage/tools.js';
import { aggregate, misconceptions, allVotes } from '../js/stage/pages.js';
import { pickThreeFat, apparentDip, planeFrom3 } from '../js/engine/geology/index.js';
import { missionGeo, threePoints, TAB_AB, midLine, galerie } from '../js/stage/lessons/geoworld.js';
import * as S from '../js/stage/lessons/geosection.js';

test('Mazur : seuils 30 / 70 %', () => {
  assert.equal(mazur([2, 8, 0, 0], 0).band, 'low');
  assert.equal(mazur([5, 5, 0, 0], 0).band, 'mid');
  assert.equal(mazur([8, 1, 1, 0], 0).band, 'high');
  assert.equal(mazur([0, 0, 0, 0], 0), null);
});

test('journal : agrégation, gain du revote', () => {
  const log = [{ lesson: 'x', scene: 'v', votes: [6, 2, 2, 0], pre: [3, 5, 2, 0], ok: 0 }, { lesson: 'x', scene: 'v', votes: [8, 1, 1, 0], pre: null, ok: 0 }];
  const [a] = aggregate(log);
  assert.equal(a.tot, 20); assert.equal(a.pct, 70); assert.equal(a.gain, 30);
});

test('bibliothèque : chaque malentendu est nommé, expliqué et relié à un vote', () => {
  const ms = misconceptions(); assert.ok(ms.length >= 30);
  for (const m of ms) { assert.ok(has('mis.' + m.id) && has('mis.' + m.id + '.why'), 'texte manquant ' + m.id); assert.ok(m.uses.length >= 1); }
  assert.ok(allVotes().length >= 10);
});

test('pickThreeFat : écarts d’altitude et de distance respectés', () => {
  const s = []; for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) s.push({ x: i * 4 + j, y: j * 5 + i % 3, z: 400 + i * 30 + j * 4 });
  const r = pickThreeFat(s, 45, 7); assert.equal(r.length, 3);
  const z = r.map(p => p.z).sort((a, b) => a - b); assert.ok(z[1] - z[0] >= 45 && z[2] - z[1] >= 45);
  assert.deepEqual(pickThreeFat(s, 45, 7), r);
});

test('trois points : pendage retrouvé = pendage du moteur (± 3°)', () => {
  const G = missionGeo();
  assert.ok(Math.abs(G.dip - 35) < 1e-9);
  const sec = S.sectionOf(G, G.A, G.B);
  assert.ok(sec.cps.length >= 2);
  const a = G.apparent, exact = S.exactAngle(sec, sec.cps[1].from, sec.cps[1].to);
  assert.ok(Math.abs(a - exact) < 3, `pendage apparent ${a} vs coupe ${exact}`);
});

test('pendage apparent : tan α′ = tan δ · |cos β|', () => {
  assert.ok(Math.abs(apparentDip(45, 90, 90) - 45) < 1e-9);
  assert.ok(Math.abs(apparentDip(45, 90, 0)) < 1e-9);
  assert.ok(Math.abs(apparentDip(45, 90, 30) - Math.atan(Math.tan(Math.PI / 4) * Math.cos(Math.PI / 3)) * 180 / Math.PI) < 1e-9);
});

test('coupe : géométrie et rendu déterministes', () => {
  const G = galerie('anticlinal'), l = midLine(G), s1 = S.sectionOf(G, l.A, l.B, 120, 70), F = S.frame(s1, { x: 10, y: 3, w: 144, h: 50 });
  const r1 = S.regionsSvg(s1, F, { labels: true }) + S.clipped(s1, F, S.stripSvg(s1, F), { ground: true });
  const G2 = galerie('anticlinal'), l2 = midLine(G2), s2 = S.sectionOf(G2, l2.A, l2.B, 120, 70), F2 = S.frame(s2, { x: 10, y: 3, w: 144, h: 50 });
  assert.equal(S.regionsSvg(s2, F2, { labels: true }) + S.clipped(s2, F2, S.stripSvg(s2, F2), { ground: true }), r1);
  assert.ok(!/NaN|undefined/.test(r1));
});
