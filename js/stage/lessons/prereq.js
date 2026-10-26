/* LEÇON PRÉALABLE « Lire le relief » (v3.1, WP4) — trois votes de 2 minutes avant les cartes géologiques. Facultative : elle n'allonge pas la leçon « Cartes
   géologiques » (≈ 38 min). Elle vérifie les trois réflexes de topographie dont tout le raisonnement géologique dépend :
     1. une courbe de niveau est une ligne de MÊME altitude (un contact horizontal suit une courbe ; un contact incliné les croise) ;
     2. les chiffres des courbes disent où l'on monte et où l'on descend (le sens du pendage est « vers le bas ») ;
     3. dans une vallée, le V des courbes pointe vers l'AMONT (la règle des V d'un contact en dépend).
   Entièrement active (3 votes), au même rythme que les autres leçons Stage. Les malentendus testés sont nommés (bibliothèque des malentendus) ; les trois
   premiers (t-pente, t-dist, t-veg) sont ceux du thème 4.
   STATUT : BROUILLON AUTOMATIQUE — questions, options, notes et seuils à relire par un géologue / un enseignant de topographie (L.draft = true). */
import * as K from '../kit.js';
import { levelPaths, fillBox } from './maps.js';
import { demFromForm } from '../../engine/terrain/index.js';
import { top } from './geomap.js';
const { C, txt, line, rect, circ, path, arrow, at, tag } = K;

const cache = new Map();
/* colline adoucie (pente .6) : les courbes 500 et 300 sont deux fois plus écartées, la flèche P → Q du vote 2 devient lisible au dernier rang */
const SLOPE = { colline: .6 };
const dem = f => { if (!cache.has(f)) cache.set(f, demFromForm(f, { base: 200, relief: 400, slope: SLOPE[f] || 1, scaleN: 25000 })); return cache.get(f); };
const BOX = { x: 4, y: 19, w: 82, h: 46.4 };                     // x ≤ 86 : les cartes d'options occupent x ≥ 90 ; y ≥ 19 : la question (2 lignes) reste au-dessus de la carte
const EQ = 100;                                                   // équidistance large : 4 à 5 courbes seulement, chacune lisible depuis le dernier rang

/* ---------- lecture des courbes dans le repère de la figure ---------- */
const chainOf = (d, level) => { const lv = levelPaths(d, EQ, BOX).find(l => l.level === level); return lv && lv.chains.reduce((m, c) => !m || c.length > m.length ? c : m, null); };
const inside = p => p[0] > BOX.x + 6 && p[0] < BOX.x + BOX.w - 6 && p[1] > BOX.y + 5 && p[1] < BOX.y + BOX.h - 5;
/* point d'une chaîne à la fraction f de sa longueur, ramené vers l'intérieur de la carte si besoin */
const at_ = (ch, f) => { for (let k = 0; k < ch.length; k++) { const q = ch[(Math.floor(ch.length * f) + k) % ch.length]; if (inside(q)) return q; } return ch[Math.floor(ch.length * f)]; };
/* la carte : courbes fines, une courbe sur deux épaisse ; les altitudes de `labelled` sont écrites (les autres courbes se déduisent par comptage) */
function contourMap(d, labelled) {
  let thin = '', thick = '', labs = '';
  for (const lv of levelPaths(d, EQ, BOX)) (lv.level % 100 === 0 ? (thick += lv.d) : (thin += lv.d));
  for (const [z, f = .5] of labelled.map(l => [].concat(l))) { const ch = chainOf(d, z); if (ch) { const q = typeof f === 'function' ? f(ch) : at_(ch, f); labs += txt(q[0], q[1], String(z), { size: 3.8, w: 800 }); } }
  return fillBox(BOX) + path(thin, { stroke: '#a9692f', w: .32 }) + path(thick, { stroke: '#5a2a08', w: .7 }) + labs;
}
/* `dir` (vecteur unitaire) : l'étiquette est posée de ce côté du point, pour ne jamais couvrir la flèche qui relie P à Q */
const dot = (q, label, dir = [1, -.6], fill = C.acc) => circ(q[0], q[1], 1.9, { fill, stroke: '#fff', w: .6 }) + tag(q[0] + dir[0] * 5.2, q[1] + dir[1] * 5.2, label, { size: 4.2, fill });

/* ---------- figures des trois votes (calculées, pas dessinées à la main) ---------- */
const fig1 = () => { const d = dem('colline'), ch = chainOf(d, 400), P = at_(ch, .22), Q = at_(ch, .68); return { P, Q, zP: 400, zQ: 400, svg: contourMap(d, [300, 400, 500]) + dot(P, 'P') + dot(Q, 'Q') }; };
const fig2 = () => {
  /* P = bord ouest de la courbe 500, Q = point de la courbe 300 à la même hauteur vers l'ouest : flèche horizontale, longue, qui croise 400 ;
     altitudes écrites à l'est et au sud, loin de la flèche et jamais alignées ; étiquettes P et Q au-dessus des points */
  const d = dem('colline'), hi = chainOf(d, 500), lo = chainOf(d, 300), P = hi.filter(inside).reduce((m, q) => !m || q[0] < m[0] ? q : m, null);
  const Q = lo.filter(q => inside(q) && q[0] < P[0]).reduce((m, q) => !m || Math.abs(q[1] - P[1]) < Math.abs(m[1] - P[1]) ? q : m, null);
  const ext = (k, sg) => ch => ch.filter(inside).reduce((m, q) => !m || sg * q[k] > sg * m[k] ? q : m, null), east = ext(0, 1), south = ext(1, 1);
  const ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]), u = [Math.cos(ang), Math.sin(ang)], a = [P[0] + u[0] * 2.4, P[1] + u[1] * 2.4], b = [Q[0] - u[0] * 2.4, Q[1] - u[1] * 2.4];
  return { P, Q, zP: 500, zQ: 300, svg: contourMap(d, [[500, east], [400, south], [300, east]]) + arrow(a[0], a[1], b[0], b[1], { c: '#fff', w: 3.4, head: 5.6 }) + arrow(a[0], a[1], b[0], b[1], { c: C.ink, w: 1.5, head: 4.2 }) + dot(P, 'P', [0, -1]) + dot(Q, 'Q', [0, -1]) };
};
/* le sommet d'un V : dans la vallée de démonstration l'axe monte vers le haut de la figure ; la courbe 300 est un V unique, sa pointe est son point le plus haut */
const fig3 = () => {
  const d = dem('vallee'), ch = chainOf(d, 300), apex = ch.filter(inside).reduce((m, q) => !m || q[1] < m[1] ? q : m, null);
  return { apex, z: 300, up: ch.filter(inside).every(q => q[1] >= apex[1]), svg: contourMap(d, [[300, .12], 400, 500]) + circ(apex[0], apex[1], 5.2, { fill: 'none', stroke: '#fff', w: 2.6 }) + circ(apex[0], apex[1], 5.2, { fill: 'none', stroke: C.acc, w: 1.2 }) };
};
export const FIGS = { v1: fig1, v2: fig2, v3: fig3 };

/* ---------- la leçon ---------- */
const vote = (id, opts) => ({ id, kind: 'vote', min: 2, vote: { opts, draw: (st, X) => FIGS[id]().svg + top(X.t(`prereq.${id}.top`), 78) }, q: 1 });
export const prereq = {
  id: 'prereq', title: 'prereq.title', seed: 3, draft: true, prereq: true,
  scenes: [
    vote('v1', [{ ok: true }, { mis: 't-pente' }, { mis: 't-dist' }, { mis: 't-veg' }]),
    vote('v2', [{ ok: true }, { mis: 'c-sens' }, { mis: 'c-plat' }, { mis: 'c-nsp' }]),
    vote('v3', [{ ok: true }, { mis: 'c-vaval' }, { mis: 'c-vnord' }, { mis: 'c-vnsp' }]),
    { id: 'recap', kind: 'recap', steps: 3, min: 1,
      fig: (st, p, X) => [0, 1, 2].map(i => at(st, i, rect(10, 8 + i * 19, 140, 15.5, { fill: C.soft, rx: 2 }) + path(`M16 ${15.6 + i * 19}l3 3.2l6-7`, { stroke: C.green, w: 1.4 }) + txt(32, 15.8 + i * 19, X.t(`prereq.recap.r${i}`), { size: 6.2, anchor: 'start', w: 800 }), { rest: false })).join('') }
  ]
};

const sc = (id, claim, cs, note, ask) => Object.fromEntries([[`prereq.${id}.claim`, claim], ...cs.map((c, i) => [`prereq.${id}.c${i}`, c]), [`prereq.${id}.note`, note], [`prereq.${id}.ask`, ask]]);
const vt = (id, claim, top_, opts, sol, note, ask) => ({ ...sc(id, claim, ['Réfléchissez 20 secondes, sans parler.', 'Votez : A, B, C ou D.'], note, ask), [`prereq.${id}.top`]: top_, [`prereq.${id}.q`]: top_, ...Object.fromEntries(opts.map((o, i) => [`prereq.${id}.o${i}`, o])), [`prereq.${id}.sol`]: sol });
export const FR = {
  'prereq.title': 'Avant les cartes géologiques : lire le relief',
  'ix.pre': 'Avant la géologie : lire le relief', 'ix.pre.d': 'Trois votes sur les courbes de niveau (facultatif, 7 min)',
  ...vt('v1', 'Même courbe, même altitude ?', 'P et Q sont sur la même courbe. Ils sont…',
    ['À la même altitude', 'À la même pente', 'À même distance du sommet', 'Dans la même végétation'],
    'Une courbe de niveau relie des points de même altitude.',
    'Le réflexe de base de toute la leçon suivante : un contact qui suit une courbe reste à la même altitude (couche horizontale) ; un contact qui les croise monte ou descend (couche inclinée).',
    'Pourquoi une courbe ne peut-elle ni monter ni descendre ?'),
  ...vt('v2', 'Monter ou descendre ?', 'De P vers Q, on…',
    ['Descend', 'Monte', 'Reste à la même altitude', 'On ne peut pas savoir'],
    'Les chiffres baissent de P vers Q : on descend.',
    'Les chiffres des courbes disent le sens de la pente. Le sens du pendage d’une couche se lit de la même façon : vers l’altitude la plus basse du contact.',
    'Quelle courbe traverse-t-on entre P et Q ? Que vaut-elle ?'),
  ...vt('v3', 'Où pointe le V ?', 'Dans une vallée, le V des courbes pointe…',
    ['Vers l’amont (en montant)', 'Vers l’aval (en descendant)', 'Vers le Nord', 'On ne peut pas savoir'],
    'Le V d’une courbe pointe vers l’amont, là où les altitudes montent.',
    'Pont vers la règle des V : un contact géologique incliné qui traverse une vallée dessine, lui aussi, un V — dont la pointe donne le sens du pendage.',
    'Comment lit-on l’amont sur une carte ?'),
  'prereq.recap.claim': 'À retenir', 'prereq.recap.note': 'Si les trois réflexes sont acquis, passer aux cartes géologiques ; sinon revoir le thème 4 (courbes de niveau) d’abord.', 'prereq.recap.ask': 'Lequel de ces trois réflexes vous paraît le moins sûr ?',
  'prereq.recap.c0': '**Une courbe** = une seule altitude.', 'prereq.recap.c1': 'Les chiffres disent **où l’on descend**.', 'prereq.recap.c2': 'Le V pointe vers l’**amont**.',
  'prereq.recap.r0': 'Courbe = même altitude', 'prereq.recap.r1': 'Les chiffres : monter / descendre', 'prereq.recap.r2': 'Le V pointe vers l’amont',
  'mis.c-sens': 'Sens de la pente lu à l’envers', 'mis.c-sens.why': 'Les chiffres baissent de P vers Q : le terrain descend dans ce sens.',
  'mis.c-plat': 'Courbes traversées, altitude « inchangée »', 'mis.c-plat.why': 'On ne reste à la même altitude qu’en suivant une courbe, pas en les croisant.',
  'mis.c-nsp': 'Chiffres des courbes ignorés', 'mis.c-nsp.why': 'Les altitudes écrites sur les courbes suffisent à répondre.',
  'mis.c-vaval': 'V pris pour le sens d’écoulement', 'mis.c-vaval.why': 'Le V pointe vers l’amont ; l’eau s’écoule en sens inverse, vers l’ouverture du V.',
  'mis.c-vnord': 'Orientation du V liée au Nord', 'mis.c-vnord.why': 'Le V suit la vallée, pas la boussole : il pointe vers l’amont, quelle que soit l’orientation.',
  'mis.c-vnsp': 'Le V « ne dirait rien »', 'mis.c-vnsp.why': 'Le V indique l’amont : c’est même la clé de la règle des V pour les contacts.'
};
