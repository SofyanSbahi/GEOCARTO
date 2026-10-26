/* Thème 2 — ORIENTATION. 7 scènes ≈ 15 min. Idée centrale : un azimut se mesure depuis le NORD, dans le sens des aiguilles d'une montre. */
import * as K from '../kit.js';
import { recapFig } from './mission.js';
import { dirName } from '../../engine/math.js';
const { C, txt, txtL, line, rect, circ, path, g, arrow, at, badge, tag, lo, el } = K;
const rad = a => a * Math.PI / 180;
const P = (cx, cy, r, az) => [cx + Math.sin(rad(az)) * r, cy - Math.cos(rad(az)) * r];
const arc = (cx, cy, r, a0, a1) => { const [x0, y0] = P(cx, cy, r, a0), [x1, y1] = P(cx, cy, r, a1); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${(a1 - a0) % 360 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
const CARD = [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'O']], INTER = [[45, 'NE'], [135, 'SE'], [225, 'SO'], [315, 'NO']];
export function rose(cx, cy, R, hl) {
  let o = circ(cx, cy, R, { stroke: C.ink, w: .7, fill: '#fff' });
  if (hl != null) { const a0 = hl * 22.5 - 11.25, a1 = hl * 22.5 + 11.25, [x0, y0] = P(cx, cy, R, a0), [x1, y1] = P(cx, cy, R, a1); o += path(`M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`, { fill: C.gold, stroke: C.ink, w: .5, op: .85 }); }
  for (let i = 0; i < 16; i++) { const [x1, y1] = P(cx, cy, R, i * 22.5), [x2, y2] = P(cx, cy, R - (i % 4 ? 1.6 : 3), i * 22.5); o += line(x1, y1, x2, y2, { w: i % 4 ? .4 : .7 }); }
  CARD.forEach(([a, l]) => { const [x, y] = P(cx, cy, R + 4.6, a); o += txt(x, y, l, { size: 5, w: 800 }); });
  INTER.forEach(([a, l]) => { const [x, y] = P(cx, cy, R + 4.8, a); o += lo(txt(x, y, l, { size: 3.6, w: 700, fill: C.mute })); });
  return o;
}
const seg = (cx, cy, L, az, o = {}) => { const [x, y] = P(cx, cy, L, az); return arrow(cx, cy, x, y, { c: o.c || C.acc, w: o.w || 1 }) + circ(cx, cy, 1.5, { fill: C.ink }); };

export const orient = {
  id: 'orient', title: 'topic.2', seed: 7,
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 1,
      fig: (st, p, X) => {
        const sheet = rect(36, 4, 88, 62, { fill: '#f6f1e2', stroke: C.ink, w: .9, rx: 1 }) + path('M44 52C60 40 70 56 90 44S112 34 116 30M44 24C56 18 66 24 76 14', { stroke: C.brown, w: .8 });
        let o = sheet;
        o += at(st, 0, arrow(80, 30, 80, 10, { c: C.mute, w: .8, dash: '2 1.5' }) + tag(80, 34, X.t('orient.guess'), { size: 4.6, fill: C.mute }), { fade: true });
        o += at(st, 1, g(arrow(80, 44, 80, 12, { c: C.acc, w: 1.2, head: 3 }) + tag(80, 8.4, 'N', { size: 5, fill: C.acc }), { transform: 'rotate(22 80 44)' }));
        o += at(st, 2, tag(80, 62, X.t('orient.look'), { size: 4.4, fill: C.ink }));
        return o;
      } },
    { id: 'norths', kind: 'show', steps: 3, min: 3, param: { values: [10, 15, 20, 25], start: 0, label: (v, i, X) => X.t('orient.decl', { d: v }) },
      fig: (st, d, X) => {
        const O = [44, 60], R = 42, ng = P(O[0], O[1], R, 0), nm = P(O[0], O[1], R, -d), nl = P(O[0], O[1], R, 12);
        let o = circ(O[0], O[1], 1.8, { fill: C.ink }) + arrow(O[0], O[1], ng[0], ng[1], { c: C.ink, w: 1.1, head: 3 }) + txt(ng[0] + 1, ng[1] - 4.6, 'NG', { size: 5, fill: C.ink, w: 800 });
        o += at(st, 1, arrow(O[0], O[1], nm[0], nm[1], { c: C.blue, w: 1.1, head: 3 }) + txt(nm[0] - 4, nm[1] - 4.6, 'NM', { size: 5, fill: C.blue, w: 800 }) + path(arc(O[0], O[1], 30, -d, 0), { stroke: C.blue, w: .8 }) + txt(O[0] - 8, O[1] - 33, `${d}°`, { size: 4.6, fill: C.blue }));
        o += at(st, 2, arrow(O[0], O[1], nl[0], nl[1], { c: C.green, w: 1.1, head: 3 }) + txt(nl[0] + 7, nl[1] - 3, 'NL', { size: 5, fill: C.green, w: 800 }));
        const rows = [['NG', X.t('orient.ng'), C.ink], ['NM', X.t('orient.nm'), C.blue], ['NL', X.t('orient.nl'), C.green]];
        rows.forEach((r, i) => { if (st === i) { const f = K.fit(r[1], 56, 4.8, 3); o += at(st, i, tag(98, 24, r[0], { size: 5.6, fill: r[2], anchor: 'start' }) + K.txtL(98, 24 + 5.6 * K.fsz() * .75 + f.size * .9, f.lines, { size: f.size, anchor: 'start', w: 800, fixed: true }));   /* fit applique déjà le facteur de salle : fixed évite de l'appliquer deux fois */ } });
        return o;
      } },
    { id: 'azimuth', kind: 'build', steps: 4, min: 3, param: { values: [52, 130, 245, 318], start: 0, label: (v) => v + '°' },
      fig: (st, az, X) => {
        const C0 = [46, 36], R = 24, hl = Math.round(az / 22.5) % 16;
        let o = rose(C0[0], C0[1], R, st >= 3 ? hl : null) + line(C0[0], C0[1], C0[0], C0[1] - R, { c: C.ink, w: .8, dash: '1.6 1.2' }) + seg(C0[0], C0[1], R - 2.5, az);
        const [bx, by] = P(C0[0], C0[1], R - 2.5, az); o += badge(bx, by, 'B', { r: 2.6, fill: C.acc });
        o += at(st, 1, path(arc(C0[0], C0[1], 11, 0, az), { stroke: C.acc, w: 1.1 }) + arrow(...P(C0[0], C0[1], 11, az - 4), ...P(C0[0], C0[1], 11, az), { c: C.acc, w: 1.1, head: 2.6 }));
        o += at(st, 2, rect(96, 10, 58, 22, { fill: C.soft, rx: 2 }) + txt(125, 17, X.t('orient.az'), { size: 4.4, w: 700 }) + txt(125, 26.2, az + '°', { size: 9.4, fill: C.acc, w: 800 }));
        o += at(st, 3, rect(96, 38, 58, 22, { fill: '#fff6d6', stroke: C.ink, w: .5, rx: 2 }) + txt(125, 45, X.t('orient.dir'), { size: 4.4, w: 700 }) + txt(125, 54, dirName(az), { size: 9.4, w: 800 }));
        return o;
      } },
    { id: 'v1', kind: 'vote', min: 2,
      vote: { opts: [{ ok: true }, { mis: 'o-sens' }, { mis: 'o-secteur' }, { mis: 'o-axe' }],
        draw: (st, X) => rose(46, 42, 19) + seg(46, 42, 16.5, 70) + tag(46, 5.6, X.t('orient.v1.top'), { size: 4.8, fill: C.ink }) },   /* rose plus basse et plus petite : le titre agrandi ne recouvre plus « N » */
      q: 1 },
    { id: 'pr', kind: 'practice', min: 3, practice: { ch: 'orient', seconds: 60 } },
    { id: 'recap', kind: 'recap', steps: 4, min: 1,
      fig: (st, p, X) => recapFig('orient', st, X) }
  ]
};
export const FR = {
  'topic.2': 'Orientation', 'topic.2.d': 'Trois nords, azimut, rose des vents',
  'orient.sheet': 'feuille de carte', 'orient.guess': 'Le haut de la feuille = le nord ?', 'orient.look': 'Lire la flèche nord',
  'orient.decl': 'Déclinaison {d}° O (exagérée)', 'orient.ng': 'Nord géo. : pôle', 'orient.nm': 'Nord magn. : boussole', 'orient.nl': 'Nord carte : Lambert',
  'orient.az': 'Azimut', 'orient.dir': 'Direction (16 secteurs)', 'orient.v1.top': 'Azimut A→B = 70°',
  'orient.recap.r0': 'Azimut : depuis le Nord', 'orient.recap.r1': 'Sens des aiguilles d’une montre', 'orient.recap.r2': '16 secteurs de 22,5°',
  'orient.hook.claim': 'Haut de feuille ≠ nord',
  'orient.hook.c0': 'Instinct : le haut de la feuille, c’est le nord.',
  'orient.hook.c1': 'Faux : la flèche de la carte est **inclinée**.',
  'orient.hook.c2': 'Toujours **lire la flèche** avant de mesurer.',
  'orient.hook.note': 'Tourner une vraie carte papier devant la salle.', 'orient.hook.ask': 'Pourquoi la flèche est-elle inclinée ?',
  'orient.norths.claim': 'Trois nords sur une carte',
  'orient.norths.c0': '**NG** : le nord géographique, vers le pôle.',
  'orient.norths.c1': '**NM** : la boussole s’en écarte de la déclinaison.',
  'orient.norths.c2': '**NL** : le quadrillage Lambert est incliné aussi.',
  'orient.norths.note': 'Valeurs exagérées pour la lisibilité ; lire les vraies sur la marge de la carte.', 'orient.norths.ask': 'Quel nord utilise la boussole ?',
  'orient.azimuth.claim': 'Mesurer un azimut',
  'orient.azimuth.c0': 'On part du **Nord**, trait pointillé.',
  'orient.azimuth.c1': 'On tourne **dans le sens des aiguilles d’une montre**.',
  'orient.azimuth.c2': 'L’angle lu est l’**azimut**.',
  'orient.azimuth.c3': 'Chaque secteur de la rose = **22,5°**.',
  'orient.azimuth.note': 'Changer l’azimut avec ↑ ↓ ; faire prédire le secteur avant l’étape 4.', 'orient.azimuth.ask': 'Où est 270° ?',
  'orient.v1.claim': 'Quelle direction ?', 'orient.v1.q': 'Azimut 70° : quelle direction ?',
  'orient.v1.c0': 'Lisez sur la rose.', 'orient.v1.c1': 'Votez : A, B, C ou D.',
  'orient.v1.o0': 'ENE', 'orient.v1.o1': 'ONO', 'orient.v1.o2': 'NE', 'orient.v1.o3': 'NNE',
  'orient.v1.sol': '70° ÷ 22,5 ≈ 3 secteurs depuis N : ENE.', 'orient.v1.note': 'Le malentendu le plus fréquent : lire dans le mauvais sens.', 'orient.v1.ask': 'Qui a compté depuis l’Ouest ?',
  'orient.pr.claim': 'À vous de jouer', 'orient.pr.c0': 'Lisez l’énoncé.', 'orient.pr.c1': 'Réfléchissez : le minuteur tourne.', 'orient.pr.c2': 'Correction.', 'orient.pr.note': 'Même moteur d’exercices que l’espace élève.', 'orient.pr.ask': 'Qui a utilisé la rose ?',
  'orient.recap.claim': 'À retenir', 'orient.recap.c0': 'Trois idées.', 'orient.recap.note': 'Faire reformuler.', 'orient.recap.ask': 'Un azimut de 200° : vers où ?',
  'mis.o-sens': 'Sens inverse', 'mis.o-sens.why': 'L’azimut croît dans le sens horaire : 70° ⇒ côté Est, pas 290°.',
  'mis.o-secteur': 'Secteur de 45° au lieu de 22,5°', 'mis.o-secteur.why': 'La rose à 16 secteurs : chaque secteur = 22,5°.',
  'mis.o-axe': 'Confusion des secteurs voisins', 'mis.o-axe.why': 'Compter 3 secteurs depuis N : NNE, NE, puis ENE.'
};
