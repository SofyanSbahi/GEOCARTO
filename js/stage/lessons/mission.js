/* FIL ROUGE — « la mission » : un camp A, un refuge B, UN SEUL terrain pour toute la séance.
   Chaque leçon répond à une question de la mission (distance, direction, position, relief, pente, profil) ; la dernière image de la leçon
   affiche cette réponse, CALCULÉE par le moteur sur le terrain de la mission. Un récit continu vaut mieux que huit chapitres indépendants :
   l'étudiant sait toujours pourquoi on apprend ce qu'on apprend. */
import * as K from '../kit.js';
import { mapSvg, toMap } from './maps.js';
import { setup } from './profil.js';
const { C, txt, line, rect, circ, path, arrow, at, badge, tag } = K;

export const MISSION_SEED = 4;
const cache = {};
export const dirName = az => DIRS[Math.round(((az % 360) + 360) % 360 / 22.5) % 16];
const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
export const MAP = { x: 2, y: .5, w: 100, h: 68.9 };

/* toutes les valeurs de la mission (nombres bruts, déterministes) */
export function mission() {
  if (cache.m) return cache.m;
  const c = setup(MISSION_SEED), { d, A, B, P, L } = c, r5 = z => Math.round(z / 5) * 5;
  const dx = B.x - A.x, dy = B.y - A.y, az = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  const zA = r5(P[0].z), zB = r5(P[P.length - 1].z), top = P.reduce((m, q) => q.z > m.z ? q : m, P[0]);
  return cache.m = {
    c, d, A, B, L, az: Math.round(az), dir: DIRS[Math.round(az / 22.5) % 16], cm: L * 100 / d.scaleN,
    X: 456 + B.x * d.cellM / 1000, Y: 320 + (d.H - 1 - B.y) * d.cellM / 1000, zA, zB, dz: zB - zA, pct: Math.abs(zB - zA) / L * 100, zTop: r5(top.z), sTop: top.s
  };
}
/* ligne de la mission affichée à la fin de chaque leçon */
export const extras = {};   // fournisseurs enregistrés par les modules géologiques (évite une dépendance circulaire)
export const missionLine = (id, X, m = mission()) => ({
  echelle: ['mission.echelle', { cm: X.nf(m.cm, 1), km: X.nf(m.L / 1000, 2) }],
  orient: ['mission.orient', { az: m.az, dir: m.dir }],
  coord: ['mission.coord', { x: X.nf(m.X, 2), y: X.nf(m.Y, 2) }],
  relief: ['mission.relief', { a: m.zA, b: m.zB }],
  pente: ['mission.pente', { p: X.nf(m.pct, 1) }],
  profil: ['mission.profil', { z: m.zTop }],
  geocarte: ['mission.geocarte', { n: extras.geo ? extras.geo().units.length : 0 }],
  coupe: ['mission.coupe', { a: extras.geo ? X.nf(extras.geo().apparent, 0) : 0 }]
}[id]);
/* carte de la mission avec A (camp) et B (refuge) */
export function missionMap(m, o = {}) {
  const mp = toMap(MAP, m.d), a = mp(m.A), b = mp(m.B);
  return { a, b, svg: mapSvg(m.d, m.c.eq, MAP, { labels: o.labels !== false }), ab: (w = 1.1) => line(a[0], a[1], b[0], b[1], { c: C.acc, w }) + badge(a[0], a[1], 'A', { r: 2.8, fill: C.acc, quiet: o.quiet }) + badge(b[0], b[1], 'B', { r: 2.8, fill: C.acc, quiet: o.quiet }) };
}

/* écran « À retenir » commun : 3 idées (la dernière arrivée prend l'attention) puis la réponse de la mission */
export function recapFig(id, st, X) {
  const m = mission(), mm = toMap({ x: 12, y: 51.5, w: 22.4, h: 15.4 }, m.d), a = mm(m.A), b = mm(m.B);
  let o = [0, 1, 2].map(i => at(st, i, rect(10, 3 + i * 16, 140, 13.5, { fill: C.soft, rx: 2 }) + path(`M16 ${9.8 + i * 16}l3 3.2l6-7`, { stroke: C.green, w: 1.4 }) + txt(32, 10 + i * 16, X.t(`${id}.recap.r${i}`), { size: 6, anchor: 'start', w: 800 }), { rest: st < 3, fade: st >= 3 })).join('');
  const ml = missionLine(id, X), fl = K.fit(X.t(ml[0], ml[1]), 72, 4.8, 2), lh = fl.size * 1.36, y0 = 58.7 - (fl.lines.length - 1) * lh / 2;
  o += at(st, 3, rect(10, 49.2, 140, 18.9, { fill: '#fff6d6', stroke: C.ink, w: .7, rx: 2 }) + mapSvg(m.d, m.c.eq, { x: 12, y: 51.5, w: 22.4, h: 15.4 }, { labels: false }) +
    line(a[0], a[1], b[0], b[1], { c: C.acc, w: .9 }) + circ(a[0], a[1], 1.3, { fill: C.acc }) + circ(b[0], b[1], 1.3, { fill: C.acc }) +
    K.txtL(38, y0, fl.lines, { size: fl.size, lh: lh / K.fsz(), anchor: 'start', w: 800 }));
  return o;
}

/* ---------- le PROLOGUE : poser la mission, annoncer les six questions ---------- */
const QS = ['echelle', 'orient', 'coord', 'relief', 'pente', 'profil'];
export const prologue = {
  id: 'mission', title: 'mission.title', seed: MISSION_SEED, prologue: true, setup: () => mission(),
  scenes: [
    { id: 'hook', kind: 'hook', steps: 3, min: 2,
      fig: (st, p, X) => {
        const m = mission(), M = missionMap(m, { quiet: false }); let o = M.svg;
        o += at(st, 1, M.ab() + txt(M.a[0], M.a[1] + 6.6, X.t('mission.camp'), { size: 4.6, w: 800 }) + txt(M.b[0], M.b[1] - 6.6, X.t('mission.refuge'), { size: 4.6, w: 800 }), { rest: true });
        o += at(st, 2, tag(133, 30, X.t('mission.how'), { size: 7, fill: C.acc }));
        return o;
      } },
    { id: 'questions', kind: 'show', steps: 7, min: 3,
      fig: (st, p, X) => {
        const m = mission(), M = missionMap(m, { labels: false }); let o = M.svg + M.ab(.9);
        const mid = [(M.a[0] + M.b[0]) / 2, (M.a[1] + M.b[1]) / 2];
        o += at(st, 1, st === 1 ? txt(mid[0], mid[1] - 4.4, '? km', { size: 5.4, w: 800, fill: C.acc }) : '');
        o += at(st, 2, st === 2 ? arrow(M.a[0], M.a[1], M.a[0], M.a[1] - 18, { c: C.ink, w: .9, head: 2.6 }) + txt(M.a[0] + 4, M.a[1] - 19, 'N', { size: 5, w: 800 }) : '');
        o += at(st, 3, st === 3 ? line(M.b[0], 1, M.b[0], 69, { c: C.green, w: .8, dash: '2 1.4' }) + line(2, M.b[1], 102, M.b[1], { c: C.blue, w: .8, dash: '2 1.4' }) : '');
        o += at(st, 4, st === 4 ? txt(M.a[0], M.a[1] + 8.4, '? m', { size: 5, w: 800, fill: C.acc }) + txt(M.b[0], M.b[1] - 8.4, '? m', { size: 5, w: 800, fill: C.acc }) : '');
        o += at(st, 5, st === 5 ? txt(mid[0], mid[1] - 4.4, '? %', { size: 5.4, w: 800, fill: C.acc }) : '');
        o += at(st, 6, st === 6 ? path(`M${M.a[0]} ${M.a[1]}L${M.b[0]} ${M.b[1]}`, { stroke: C.acc, w: 2 }) : '');
        const dy = Math.max(9.4, 5.4 * K.fsz() + 1);   /* interligne ≥ demi-pastille + demi-ligne voisine, à toute échelle de salle */
        QS.forEach((q, i) => { const y = 10 + i * dy, cur = st === i + 1; o += cur ? tag(108, y, `${i + 1} ${X.t('mission.k.' + q)}`, { size: 4.6, fill: C.pri, anchor: 'start' }) : txt(108, y, `${i + 1} ${X.t('mission.k.' + q)}`, { size: 4.2, w: 700, anchor: 'start', fill: st > i + 1 ? C.mute : C.ink }); });
        return o;
      } },
    { id: 'recap', kind: 'recap', steps: 3, min: 1,
      fig: (st, p, X) => QS.map((q, i) => at(st, Math.floor(i / 2), rect(8 + (i % 2) * 72, 5 + Math.floor(i / 2) * 20, 70, 16, { fill: C.soft, rx: 2 }) + txt(43 + (i % 2) * 72, 13.2 + Math.floor(i / 2) * 20, `${X.t('mission.k.' + q)} → ${X.t('mission.l.' + q)}`, { size: 4.2, w: 800 }), { rest: true })).join('')
    }
  ]
};
export const FR = {
  ...Object.fromEntries(QS.map(q => [`${q}.recap.c3`, 'La réponse pour la mission.'])),
  'mission.title': 'Prologue : la mission',
  'mission.l.echelle': 'Échelle', 'mission.l.orient': 'Orientation', 'mission.l.coord': 'Coordonnées', 'mission.l.relief': 'Courbes', 'mission.l.pente': 'Pourcentage', 'mission.l.profil': 'Coupe',
  'mission.camp': 'Camp', 'mission.refuge': 'Refuge', 'mission.how': 'Comment ?',
  'mission.k.echelle': 'Distance', 'mission.k.orient': 'Direction', 'mission.k.coord': 'Position', 'mission.k.relief': 'Relief', 'mission.k.pente': 'Pente', 'mission.k.profil': 'Profil',
  'mission.hook.claim': 'Mission : atteindre le refuge',
  'mission.hook.c0': 'Voici la carte de la région.', 'mission.hook.c1': 'Mission : aller du **camp** au **refuge**.', 'mission.hook.c2': 'Que faut-il savoir avant de partir ?',
  'mission.hook.note': 'Laisser 30 secondes de réponses libres : les élèves nomment eux-mêmes distance, direction, pente… Les noter au tableau.', 'mission.hook.ask': 'Qu’est-ce qui vous inquiète le plus ?',
  'mission.questions.claim': 'Six questions, six leçons',
  'mission.questions.c0': 'Une seule carte, six questions.', 'mission.questions.c1': '**Combien de kilomètres** jusqu’au refuge ?', 'mission.questions.c2': '**Vers où** marcher ?', 'mission.questions.c3': '**Où exactement** est le refuge ?',
  'mission.questions.c4': 'Quelle **altitude** ? Quel terrain ?', 'mission.questions.c5': 'Est-ce que ça **monte fort** ?', 'mission.questions.c6': 'À quoi **ressemble la marche** ?',
  'mission.questions.note': 'Chaque question devient une leçon ; la réponse de la mission sera affichée à la fin de chacune.', 'mission.questions.ask': 'Dans quel ordre les poser ?',
  'mission.recap.claim': 'Le programme', 'mission.recap.c0': 'Première question : la distance.', 'mission.recap.c1': 'Puis la direction et la position.', 'mission.recap.c2': 'Puis relief, pente, profil — et la géologie.',
  'mission.recap.note': 'Lancer la leçon 1.', 'mission.recap.ask': 'Quelle question est la plus difficile ? (Deux autres suivent : la carte géologique, puis la coupe.)',
  'mission.echelle': '{cm} cm sur la carte = {km} km sur le terrain', 'mission.orient': 'Cap du camp au refuge : {az}° ({dir})',
  'mission.coord': 'Refuge : X = {x} km · Y = {y} km', 'mission.relief': 'Camp {a} m → refuge {b} m',
  'mission.pente': 'Pente moyenne du trajet : {p} %', 'mission.profil': 'Point haut du trajet : {z} m', 'mission.geocarte': 'Le trajet traverse {n} formations', 'mission.coupe': 'Pendage apparent sur A → B : {a}°'
};
